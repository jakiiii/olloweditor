from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
import venv
import zipfile
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from email.parser import Parser
from pathlib import Path
from typing import Any, TypedDict
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

import tomllib

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[1]
SMOKE_DIR = ROOT / "scripts" / "testpypi_smoke"
DEFAULT_REPORT = ROOT / "TESTPYPI_VERIFICATION.md"
DEFAULT_JSON_REPORT = ROOT / "testpypi-verification.json"
REQUIRED_ASSETS = (
    "olloweditor/static/olloweditor/olloweditor.browser.js",
    "olloweditor/static/olloweditor/olloweditor.css",
    "olloweditor/static/olloweditor/olloweditor-init.js",
)
FORBIDDEN_TEXT_PATTERNS = (
    "/home/jaki",
    "Flast",
    "Ollo Editor",
    "your-project",
    "your-username",
    "replace-me",
    "changeme",
)
SECRET_PATTERNS = (
    "ghp_",
    "pypi-",
    "__token__",
    "-----BEGIN PRIVATE KEY-----",
    "-----BEGIN OPENSSH PRIVATE KEY-----",
)


class VerificationError(RuntimeError):
    """Raised when a required verification step fails."""


@dataclass
class CommandResult:
    command: list[str]
    returncode: int
    stdout: str
    stderr: str
    cwd: str


class CommandExecutionError(VerificationError):
    """Raised when a subprocess command fails."""

    def __init__(self, result: CommandResult):
        self.result = result
        command = " ".join(result.command)
        output = (result.stdout + "\n" + result.stderr).strip()
        super().__init__(
            f"Command failed with exit code {result.returncode}: {command}\n{output}"
        )


@dataclass
class TestEntry:
    name: str
    environment: str
    status: str = "pending"
    notes: str = ""
    details: dict[str, Any] = field(default_factory=dict)
    failure: dict[str, Any] | None = None


class EnvSpec(TypedDict):
    extra: str | None
    helper: str
    extra_packages: list[str]


def validate_package_name(name: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?", name):
        raise ValueError(f"Invalid package name: {name!r}")
    return name


def validate_version(value: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._!+\-]*", value):
        raise ValueError(f"Invalid version: {value!r}")
    return value


def normalize_name(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def venv_python(path: Path) -> Path:
    if sys.platform == "win32":
        return path / "Scripts" / "python.exe"
    return path / "bin" / "python"


def sanitized_env() -> dict[str, str]:
    env = os.environ.copy()
    env.pop("PYTHONPATH", None)
    env["PYTHONNOUSERSITE"] = "1"
    env["PIP_DISABLE_PIP_VERSION_CHECK"] = "1"
    env["OLLOWEDITOR_REPO_ROOT"] = str(REPO_ROOT.resolve())
    return env


def run_command(
    command: list[str],
    *,
    cwd: Path,
    env: dict[str, str] | None = None,
    verbose: bool = False,
    check: bool = True,
) -> CommandResult:
    if verbose:
        print(f"+ ({cwd}) {' '.join(command)}")
    completed = subprocess.run(
        command,
        cwd=cwd,
        env=env,
        capture_output=True,
        text=True,
    )
    result = CommandResult(
        command=command,
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
        cwd=str(cwd),
    )
    if verbose and completed.stdout:
        print(completed.stdout, end="" if completed.stdout.endswith("\n") else "\n")
    if verbose and completed.stderr:
        print(
            completed.stderr,
            end="" if completed.stderr.endswith("\n") else "\n",
            file=sys.stderr,
        )
    if check and completed.returncode != 0:
        raise CommandExecutionError(result)
    return result


def load_local_expectations() -> dict[str, Any]:
    pyproject = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf8"))
    project = pyproject["project"]
    extras = project.get("optional-dependencies", {})
    return {
        "name": project["name"],
        "version": project["version"],
        "requires_python": project["requires-python"],
        "license": project["license"],
        "urls": project.get("urls", {}),
        "extras": sorted(extras),
        "required_extras": sorted(
            name
            for name in ("django", "drf", "flask", "fastapi", "all")
            if name in extras
        ),
    }


def index_base(index_url: str) -> str:
    return index_url.removesuffix("/").removesuffix("/simple")


def fetch_json(url: str) -> dict[str, Any]:
    try:
        with urlopen(url, timeout=30) as response:  # noqa: S310
            return json.load(response)
    except HTTPError as exc:
        raise VerificationError(f"HTTP error while fetching {url}: {exc}") from exc
    except URLError as exc:
        raise VerificationError(f"Failed to reach {url}: {exc}") from exc


def fetch_text(url: str) -> str:
    try:
        with urlopen(url, timeout=30) as response:  # noqa: S310
            return response.read().decode("utf8", "replace")
    except HTTPError as exc:
        raise VerificationError(f"HTTP error while fetching {url}: {exc}") from exc
    except URLError as exc:
        raise VerificationError(f"Failed to reach {url}: {exc}") from exc


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_wheel_metadata(
    wheel_path: Path,
) -> tuple[dict[str, Any], dict[str, int], list[str]]:
    with zipfile.ZipFile(wheel_path) as archive:
        metadata_name = next(
            name for name in archive.namelist() if name.endswith(".dist-info/METADATA")
        )
        metadata_text = archive.read(metadata_name).decode("utf8")
        metadata = Parser().parsestr(metadata_text)
        asset_sizes = {}
        for item in REQUIRED_ASSETS:
            if item not in archive.namelist():
                raise VerificationError(f"Required asset missing from wheel: {item}")
            asset_sizes[item] = archive.getinfo(item).file_size
            if asset_sizes[item] <= 0:
                raise VerificationError(f"Required asset is empty in wheel: {item}")
        return (
            {
                "name": metadata.get("Name"),
                "version": metadata.get("Version"),
                "requires_python": metadata.get("Requires-Python"),
                "license": metadata.get("License"),
                "summary": metadata.get("Summary"),
                "provides_extra": metadata.get_all("Provides-Extra", []),
                "requires_dist": metadata.get_all("Requires-Dist", []),
                "project_urls": metadata.get_all("Project-URL", []),
            },
            asset_sizes,
            archive.namelist(),
        )


def inspect_wheel(wheel_path: Path) -> dict[str, Any]:
    metadata, asset_sizes, names = parse_wheel_metadata(wheel_path)
    with zipfile.ZipFile(wheel_path) as archive:
        bundle_text = archive.read(
            "olloweditor/static/olloweditor/olloweditor.browser.js"
        ).decode("utf8")
        css_text = archive.read(
            "olloweditor/static/olloweditor/olloweditor.css"
        ).decode("utf8")
        init_text = archive.read(
            "olloweditor/static/olloweditor/olloweditor-init.js"
        ).decode("utf8")

        forbidden_hits: dict[str, list[str]] = {}
        secret_hits: dict[str, list[str]] = {}
        for name in names:
            if not any(
                name.endswith(ext)
                for ext in (".py", ".js", ".css", ".json", ".txt", ".md", "METADATA")
            ):
                continue
            if archive.getinfo(name).file_size > 2_000_000:
                continue
            content = archive.read(name).decode("utf8", "replace")
            hits = [
                pattern for pattern in FORBIDDEN_TEXT_PATTERNS if pattern in content
            ]
            if hits:
                forbidden_hits[name] = hits
            secrets = [pattern for pattern in SECRET_PATTERNS if pattern in content]
            if secrets:
                secret_hits[name] = secrets

    if forbidden_hits:
        forbidden_text = json.dumps(forbidden_hits, indent=2)
        raise VerificationError(
            f"Packaged files contain forbidden text markers: {forbidden_text}"
        )
    if secret_hits:
        secret_text = json.dumps(secret_hits, indent=2)
        raise VerificationError(
            f"Packaged files contain secret-like markers: {secret_text}"
        )
    if re.search(r"^[ \t]*(import|export)\s", bundle_text, re.MULTILINE):
        raise VerificationError(
            "Browser bundle contains top-level import/export statements."
        )
    if (
        "window.OllowEditor" not in bundle_text
        and "global.OllowEditor" not in bundle_text
    ):
        raise VerificationError(
            "Browser bundle does not expose the expected OllowEditor global."
        )
    if not css_text.strip():
        raise VerificationError("Packaged CSS asset is empty.")
    if 'textarea[data-olloweditor="true"]' not in init_text:
        raise VerificationError(
            "Initializer does not reference the expected textarea selector."
        )
    return {
        "metadata": metadata,
        "asset_sizes": asset_sizes,
        "bundle_has_global": True,
        "bundle_has_no_toplevel_import_export": True,
        "css_non_empty": True,
        "initializer_has_selector": True,
        "packaged_files": names,
    }


def build_markdown_report(report: dict[str, Any]) -> str:
    tests = report["tests"]
    failures = [test for test in tests.values() if test["status"] == "failed"]
    result_line = (
        "GO — TestPyPI verification passed"
        if report["result"] == "passed"
        else "NO-GO — TestPyPI verification failed"
    )
    production_line = (
        "READY — Proceed to production PyPI"
        if report["result"] == "passed"
        else "NOT READY — Fix TestPyPI failures first"
    )
    rows = []
    label_map = {
        "metadata": "TestPyPI metadata",
        "wheel": "Wheel inspection",
        "base": "Base install",
        "django": "Django extra",
        "drf": "DRF extra",
        "flask": "Flask extra",
        "fastapi": "FastAPI extra",
        "all": "All extra",
        "browser": "Browser runtime",
        "example_django": "Django example",
        "example_drf": "DRF example",
        "example_flask": "Flask example",
        "example_fastapi": "FastAPI example",
        "readme": "Metadata/README",
    }
    for key, label in label_map.items():
        entry = tests[key]
        rows.append(
            "| "
            f"{label} | {entry['status'].upper()} | "
            f"{entry['environment']} | {entry.get('notes', '')} |"
        )

    artifact = report["artifact"]
    lines = [
        "# OllowEditor TestPyPI Verification",
        "",
        "## Verification information",
        "",
        f"- Date and time: `{report['generated_at']}`",
        f"- Git commit: `{report['git_commit']}`",
        f"- Package: `{report['package']}`",
        f"- Version: `{report['version']}`",
        f"- TestPyPI index: `{report['index']}`",
        f"- Python used to orchestrate the tests: `{report['python']}`",
        f"- Operating system: `{report['platform']}`",
        f"- Downloaded artifact: `{artifact.get('filename', '<not-downloaded>')}`",
        f"- Artifact SHA-256: `{artifact.get('sha256', '<unknown>')}`",
        "",
        "## Executive result",
        "",
        result_line,
        "",
        "## Test matrix",
        "",
        "| Test | Result | Environment | Notes |",
        "| --- | --- | --- | --- |",
        *rows,
        "",
        "## Artifact details",
        "",
        f"- Wheel filename: `{artifact.get('filename', '<not-downloaded>')}`",
        f"- Wheel size: `{artifact.get('size', '<unknown>')}` bytes",
        f"- SHA-256: `{artifact.get('sha256', '<unknown>')}`",
        f"- Download URL: `{artifact.get('download_url', '<unknown>')}`",
        "- Source distribution filename: "
        f"`{artifact.get('sdist_filename', '<unknown>')}`",
        f"- Requires-Python: `{artifact.get('requires_python', '<unknown>')}`",
        f"- Extras: {', '.join(artifact.get('extras', []))}",
        "",
        "### Packaged asset sizes",
        "",
    ]
    for asset_name, size in artifact.get("asset_sizes", {}).items():
        lines.append(f"- `{asset_name}`: `{size}` bytes")

    lines.extend(
        [
            "",
            "## Base package results",
            "",
            f"- Base install status: `{tests['base']['status']}`",
            "- Framework distributions absent: "
            f"`{tests['base']['details'].get('frameworks_absent')}`",
            "",
            "## Framework results",
            "",
        ]
    )
    for key, title in (
        ("django", "Django"),
        ("drf", "Django REST Framework"),
        ("flask", "Flask"),
        ("fastapi", "FastAPI"),
        ("all", "All integrations"),
    ):
        lines.extend(
            [
                f"### {title}",
                "",
                f"- Status: `{tests[key]['status']}`",
                f"- Notes: {tests[key].get('notes', '')}",
                "",
            ]
        )

    lines.extend(
        [
            "## Asset results",
            "",
            "- CSS response: "
            f"`{tests['browser']['details'].get('css_size', 'n/a')}` bytes",
            "- Browser bundle response: "
            f"`{tests['browser']['details'].get('bundle_size', 'n/a')}` bytes",
            "- Initializer response: "
            f"`{tests['browser']['details'].get('initializer_size', 'n/a')}` bytes",
            f"- Browser global: `{tests['browser']['details'].get('browser_global')}`",
            "- Textarea initialization: "
            f"`{tests['browser']['details'].get('automatic_initialization')}`",
            "- Textarea synchronization: "
            f"`{tests['browser']['details'].get('textarea_sync')}`",
            "- Multiple instances: "
            f"`{tests['browser']['details'].get('multiple_instances')}`",
            "",
            "## Failures",
            "",
        ]
    )

    if not failures:
        lines.append("No required verification failures were recorded.")
    else:
        for failure in failures:
            lines.extend(
                [
                    f"### {failure['name']}",
                    "",
                    f"- Command: `{failure['failure'].get('command', '')}`",
                    f"- Exit code: `{failure['failure'].get('returncode', '')}`",
                    "- Relevant output:",
                    "",
                    "```text",
                    failure["failure"].get("output", "").strip(),
                    "```",
                    f"- Likely cause: {failure['failure'].get('cause', '')}",
                    f"- Release impact: {failure['failure'].get('impact', '')}",
                    "",
                ]
            )

    lines.extend(
        [
            "## Final production PyPI recommendation",
            "",
            production_line,
            "",
        ]
    )
    return "\n".join(lines).strip() + "\n"


def build_json_report(
    *,
    package: str,
    version: str,
    index: str,
    artifact: dict[str, Any],
    tests: dict[str, TestEntry],
    git_commit: str,
) -> dict[str, Any]:
    result = (
        "passed"
        if all(test.status != "failed" for test in tests.values())
        else "failed"
    )
    return {
        "package": package,
        "version": version,
        "index": index,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "git_commit": git_commit,
        "python": sys.version.split()[0],
        "platform": sys.platform,
        "artifact": artifact,
        "tests": {name: asdict(entry) for name, entry in tests.items()},
        "result": result,
    }


def load_json_output(result: CommandResult) -> dict[str, Any]:
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        message = (
            "Smoke script did not return JSON.\n"
            f"STDOUT:\n{result.stdout}\n"
            f"STDERR:\n{result.stderr}"
        )
        raise VerificationError(message) from exc


def ensure_pip_check(python: Path, cwd: Path, verbose: bool) -> list[dict[str, Any]]:
    run_command(
        [str(python), "-m", "pip", "check"],
        cwd=cwd,
        env=sanitized_env(),
        verbose=verbose,
    )
    result = run_command(
        [str(python), "-m", "pip", "list", "--format", "json"],
        cwd=cwd,
        env=sanitized_env(),
        verbose=verbose,
    )
    return json.loads(result.stdout)


def make_venv(path: Path, verbose: bool) -> Path:
    venv.EnvBuilder(with_pip=True, clear=True).create(path)
    python = venv_python(path)
    run_command(
        [str(python), "-m", "pip", "install", "--upgrade", "pip"],
        cwd=path.parent,
        env=sanitized_env(),
        verbose=verbose,
    )
    return python


def install_requirement(
    python: Path,
    requirement: str,
    *,
    cwd: Path,
    index_url: str,
    verbose: bool,
) -> None:
    run_command(
        [
            str(python),
            "-m",
            "pip",
            "install",
            "--index-url",
            index_url,
            requirement,
        ],
        cwd=cwd,
        env=sanitized_env(),
        verbose=verbose,
    )


def run_smoke_script(
    python: Path,
    script_name: str,
    *,
    cwd: Path,
    verbose: bool,
) -> dict[str, Any]:
    result = run_command(
        [str(python), str(SMOKE_DIR / script_name)],
        cwd=cwd,
        env=sanitized_env(),
        verbose=verbose,
    )
    return load_json_output(result)


def read_asset_paths(python: Path, *, cwd: Path, verbose: bool) -> dict[str, str]:
    result = run_command(
        [
            str(python),
            "-c",
            textwrap.dedent(
                """
                import json
                from olloweditor.resources import get_static_root

                root = get_static_root()
                print(json.dumps({
                    "root": str(root),
                    "bundle": str(root.joinpath("olloweditor.browser.js")),
                    "css": str(root.joinpath("olloweditor.css")),
                    "init": str(root.joinpath("olloweditor-init.js")),
                }))
                """
            ),
        ],
        cwd=cwd,
        env=sanitized_env(),
        verbose=verbose,
    )
    return json.loads(result.stdout)


def run_example_snippet(
    python: Path,
    example_dir: Path,
    snippet: str,
    *,
    verbose: bool,
) -> None:
    run_command(
        [str(python), "-c", snippet],
        cwd=example_dir,
        env=sanitized_env(),
        verbose=verbose,
    )


def copy_example(example_name: str, destination_root: Path) -> Path:
    source = ROOT / "examples" / example_name
    if not source.exists():
        raise VerificationError(f"Missing documented example: {source}")
    destination = destination_root / example_name
    shutil.copytree(source, destination)
    return destination


def inspect_testpypi_metadata(
    package: str,
    version: str,
    test_index_url: str,
    expectations: dict[str, Any],
) -> dict[str, Any]:
    base = index_base(test_index_url)
    version_payload = fetch_json(f"{base}/pypi/{package}/{version}/json")
    project_payload = fetch_json(f"{base}/pypi/{package}/json")
    project_html = fetch_text(f"{base}/project/{package}/{version}/")

    if normalize_name(version_payload["info"]["name"]) != normalize_name(package):
        raise VerificationError(
            "TestPyPI project name does not match the requested package."
        )
    if version_payload["info"]["version"] != version:
        raise VerificationError(
            "TestPyPI version metadata does not match the requested version."
        )

    urls = version_payload.get("urls", [])
    wheel = next(
        (item for item in urls if item.get("packagetype") == "bdist_wheel"), None
    )
    sdist = next((item for item in urls if item.get("packagetype") == "sdist"), None)
    if wheel is None:
        raise VerificationError(
            "No wheel is present on TestPyPI for the requested version."
        )
    if sdist is None:
        raise VerificationError(
            "No source distribution is present on TestPyPI for the requested version."
        )

    if (
        version_payload["info"].get("requires_python")
        != expectations["requires_python"]
    ):
        raise VerificationError(
            "TestPyPI requires-python metadata does not match local pyproject.toml."
        )

    long_description = version_payload["info"].get("description", "")
    if not long_description.strip():
        raise VerificationError("TestPyPI long description is empty.")
    for marker in FORBIDDEN_TEXT_PATTERNS:
        if marker in long_description:
            raise VerificationError(
                f"TestPyPI long description contains forbidden marker: {marker}"
            )
    workflow_path = REPO_ROOT / ".github" / "workflows" / "python-ci.yml"
    if "python-ci.yml" in long_description and not workflow_path.exists():
        raise VerificationError(
            "README references python-ci.yml but the workflow file is missing."
        )
    if not project_html.strip() or "<html" not in project_html.lower():
        raise VerificationError(
            "TestPyPI project page did not return the expected HTML content."
        )

    return {
        "project_json": project_payload,
        "version_json": version_payload,
        "wheel": wheel,
        "sdist": sdist,
        "project_page_checked": True,
        "description_length": len(long_description),
    }


def download_exact_wheel(
    package: str,
    version: str,
    index_url: str,
    destination: Path,
    *,
    verbose: bool,
) -> Path:
    run_command(
        [
            sys.executable,
            "-m",
            "pip",
            "download",
            "--index-url",
            index_url,
            "--no-deps",
            "--only-binary=:all:",
            f"{package}=={version}",
            "-d",
            str(destination),
        ],
        cwd=destination,
        env=sanitized_env(),
        verbose=verbose,
    )
    wheels = sorted(destination.glob("*.whl"))
    if len(wheels) != 1:
        raise VerificationError(
            f"Expected exactly one downloaded wheel, found {len(wheels)}."
        )
    wheel = wheels[0]
    if version not in wheel.name:
        raise VerificationError(f"Downloaded wheel version mismatch: {wheel.name}")
    if wheel.stat().st_size <= 0:
        raise VerificationError("Downloaded wheel is empty.")
    return wheel


def run_browser_runtime(
    *,
    asset_paths: dict[str, str],
    verbose: bool,
) -> dict[str, Any]:
    result = run_command(
        [
            "node",
            str(SMOKE_DIR / "browser_runtime_check.mjs"),
            "--bundle",
            asset_paths["bundle"],
            "--init",
            asset_paths["init"],
            "--css",
            asset_paths["css"],
            "--repoRoot",
            str(REPO_ROOT.resolve()),
        ],
        cwd=REPO_ROOT,
        env=sanitized_env(),
        verbose=verbose,
    )
    return load_json_output(result)


def record_failure(
    entry: TestEntry,
    *,
    command: list[str] | None = None,
    returncode: int | None = None,
    output: str = "",
    cause: str,
    impact: str,
) -> None:
    entry.status = "failed"
    entry.failure = {
        "command": " ".join(command or []),
        "returncode": returncode,
        "output": output,
        "cause": cause,
        "impact": impact,
    }
    entry.notes = cause


def run_real_verification(args: argparse.Namespace) -> dict[str, Any]:
    expectations = load_local_expectations()
    tests = {
        "metadata": TestEntry("metadata", "Host"),
        "wheel": TestEntry("wheel", "Host"),
        "base": TestEntry("base", "Isolated venv"),
        "django": TestEntry("django", "Isolated venv"),
        "drf": TestEntry("drf", "Isolated venv"),
        "flask": TestEntry("flask", "Isolated venv"),
        "fastapi": TestEntry("fastapi", "Isolated venv"),
        "all": TestEntry("all", "Isolated venv"),
        "browser": TestEntry("browser", "Temporary browser test"),
        "example_django": TestEntry("example_django", "Isolated venv"),
        "example_drf": TestEntry("example_drf", "Isolated venv"),
        "example_flask": TestEntry("example_flask", "Isolated venv"),
        "example_fastapi": TestEntry("example_fastapi", "Isolated venv"),
        "readme": TestEntry("readme", "Host"),
    }

    workspace_context = tempfile.TemporaryDirectory(prefix=f"{args.package}-testpypi-")
    workspace = Path(workspace_context.name)
    if args.keep_environments:
        print(f"Keeping temporary verification workspace: {workspace}")

    artifact_info: dict[str, Any] = {}

    try:
        metadata_info = inspect_testpypi_metadata(
            args.package, args.version, args.test_index_url, expectations
        )
        tests["metadata"].status = "passed"
        tests["metadata"].details = {
            "project_name": metadata_info["version_json"]["info"]["name"],
            "version": metadata_info["version_json"]["info"]["version"],
            "requires_python": metadata_info["version_json"]["info"]["requires_python"],
            "wheel_filename": metadata_info["wheel"]["filename"],
            "sdist_filename": metadata_info["sdist"]["filename"],
        }

        download_dir = workspace / "download"
        download_dir.mkdir(parents=True, exist_ok=True)
        wheel_path = download_exact_wheel(
            args.package,
            args.version,
            args.test_index_url,
            download_dir,
            verbose=args.verbose,
        )

        wheel_info = inspect_wheel(wheel_path)
        tests["wheel"].status = "passed"
        tests["wheel"].details = wheel_info

        if not set(expectations["required_extras"]).issubset(
            set(wheel_info["metadata"]["provides_extra"])
        ):
            raise VerificationError(
                "Wheel extras do not match expected extras from local pyproject.toml."
            )

        artifact_info = {
            "filename": wheel_path.name,
            "size": wheel_path.stat().st_size,
            "sha256": sha256_file(wheel_path),
            "download_url": metadata_info["wheel"]["url"],
            "sdist_filename": metadata_info["sdist"]["filename"],
            "requires_python": wheel_info["metadata"]["requires_python"],
            "extras": wheel_info["metadata"]["provides_extra"],
            "asset_sizes": wheel_info["asset_sizes"],
            "metadata": wheel_info["metadata"],
        }

        env_root = workspace / "envs"
        work_root = workspace / "work"
        env_root.mkdir()
        work_root.mkdir()

        env_specs: dict[str, EnvSpec] = {
            "base": {"extra": None, "helper": "base.py", "extra_packages": []},
            "django": {
                "extra": "django",
                "helper": "django_smoke.py",
                "extra_packages": [],
            },
            "drf": {"extra": "drf", "helper": "drf.py", "extra_packages": []},
            "flask": {
                "extra": "flask",
                "helper": "flask_smoke.py",
                "extra_packages": [],
            },
            "fastapi": {
                "extra": "fastapi",
                "helper": "fastapi_smoke.py",
                "extra_packages": ["httpx>=0.27", "python-multipart>=0.0.9"],
            },
            "all": {
                "extra": "all",
                "helper": "all_integrations.py",
                "extra_packages": ["httpx>=0.27", "python-multipart>=0.0.9"],
            },
        }

        env_state: dict[str, dict[str, Any]] = {}
        for name, spec in env_specs.items():
            env_dir = env_root / name
            run_dir = work_root / name
            run_dir.mkdir()
            python = make_venv(env_dir, verbose=args.verbose)
            requirement = str(wheel_path)
            if spec["extra"] is not None:
                requirement = f"{wheel_path}[{spec['extra']}]"
            install_requirement(
                python,
                requirement,
                cwd=run_dir,
                index_url=args.production_index_url,
                verbose=args.verbose,
            )
            for extra_requirement in spec["extra_packages"]:
                install_requirement(
                    python,
                    extra_requirement,
                    cwd=run_dir,
                    index_url=args.production_index_url,
                    verbose=args.verbose,
                )
            pip_list = ensure_pip_check(python, run_dir, args.verbose)
            smoke = run_smoke_script(
                python,
                spec["helper"],
                cwd=run_dir,
                verbose=args.verbose,
            )
            tests[name].status = "passed"
            tests[name].details = {
                "pip_list": pip_list,
                "smoke": smoke,
            }
            if name == "base":
                tests[name].details["frameworks_absent"] = all(
                    distribution["name"].lower()
                    not in {"django", "djangorestframework", "flask", "fastapi"}
                    for distribution in pip_list
                )
            env_state[name] = {"python": python, "run_dir": run_dir, "smoke": smoke}

        if not args.skip_browser:
            asset_paths = read_asset_paths(
                env_state["base"]["python"],
                cwd=env_state["base"]["run_dir"],
                verbose=args.verbose,
            )
            browser_details = run_browser_runtime(
                asset_paths=asset_paths,
                verbose=args.verbose,
            )
            tests["browser"].status = "passed"
            tests["browser"].details = browser_details
        else:
            tests["browser"].status = "skipped"
            tests["browser"].notes = "Skipped by --skip-browser"

        example_root = workspace / "examples"
        example_root.mkdir()

        django_example = copy_example("django_example", example_root)
        run_example_snippet(
            env_state["django"]["python"],
            django_example,
            textwrap.dedent(
                """
                import os
                import django
                from django.core.management import call_command
                from django.test import Client

                os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_site.settings")
                django.setup()
                call_command("migrate", run_syncdb=True, verbosity=0)
                client = Client()
                assert client.get("/").status_code == 200
                assert client.get("/articles/new/").status_code == 200
                assert (
                    client.get("/static/olloweditor/olloweditor.css").status_code
                    == 200
                )
                response = client.post(
                    "/articles/new/",
                    data={
                        "title": "Example",
                        "content": "<p>TestPyPI Django content</p>",
                    },
                )
                assert response.status_code in {302, 303}
                print("ok")
                """
            ),
            verbose=args.verbose,
        )
        tests["example_django"].status = "passed"

        drf_example = copy_example("drf_example", example_root)
        run_example_snippet(
            env_state["drf"]["python"],
            drf_example,
            textwrap.dedent(
                """
                import os
                import django
                from django.core.management import call_command
                from django.test import Client

                os.environ.setdefault("DJANGO_SETTINGS_MODULE", "drf_site.settings")
                django.setup()
                call_command("migrate", run_syncdb=True, verbosity=0)
                client = Client()
                assert client.get("/").status_code == 200
                assert client.get("/api/articles/").status_code == 200
                assert (
                    client.get("/static/olloweditor/olloweditor.css").status_code
                    == 200
                )
                response = client.post(
                    "/api/articles/",
                    data='{"title":"Example","content":"<p>Saved from TestPyPI</p>"}',
                    content_type="application/json",
                )
                assert response.status_code == 201
                print("ok")
                """
            ),
            verbose=args.verbose,
        )
        tests["example_drf"].status = "passed"

        flask_example = copy_example("flask_example", example_root)
        run_example_snippet(
            env_state["flask"]["python"],
            flask_example,
            textwrap.dedent(
                """
                from app import create_app

                app = create_app()
                client = app.test_client()
                assert client.get("/").status_code == 200
                assert client.get("/olloweditor/olloweditor.css").status_code == 200
                response = client.post(
                    "/articles",
                    data={"title": "Example", "content": "<p>Saved from TestPyPI</p>"},
                )
                assert response.status_code == 302
                print("ok")
                """
            ),
            verbose=args.verbose,
        )
        tests["example_flask"].status = "passed"

        fastapi_example = copy_example("fastapi_example", example_root)
        run_example_snippet(
            env_state["fastapi"]["python"],
            fastapi_example,
            textwrap.dedent(
                """
                from fastapi.testclient import TestClient
                from main import create_app

                app = create_app()
                client = TestClient(app)
                assert client.get("/").status_code == 200
                assert (
                    client.get("/olloweditor/static/olloweditor.css").status_code
                    == 200
                )
                response = client.post(
                    "/articles",
                    data={"title": "Example", "content": "<p>Saved from TestPyPI</p>"},
                    follow_redirects=False,
                )
                assert response.status_code == 303
                print("ok")
                """
            ),
            verbose=args.verbose,
        )
        tests["example_fastapi"].status = "passed"

        version_json = metadata_info["version_json"]
        readme_details = {
            "description_non_empty": bool(
                version_json["info"].get("description", "").strip()
            ),
            "project_urls": version_json["info"].get("project_urls", {}),
            "summary": version_json["info"].get("summary"),
        }
        for marker in FORBIDDEN_TEXT_PATTERNS:
            if marker in version_json["info"].get("description", ""):
                raise VerificationError(
                    f"TestPyPI long description contains forbidden marker: {marker}"
                )
        tests["readme"].status = "passed"
        tests["readme"].details = readme_details

    except CommandExecutionError as exc:
        message = str(exc)
        failed = False
        for entry in tests.values():
            if entry.status == "pending" and not failed:
                record_failure(
                    entry,
                    command=exc.result.command,
                    returncode=exc.result.returncode,
                    output=(exc.result.stdout + "\n" + exc.result.stderr).strip(),
                    cause=message.splitlines()[0],
                    impact=(
                        "A required isolated-environment or package verification "
                        "step failed."
                    ),
                )
                failed = True
            elif entry.status == "pending":
                entry.status = "skipped"
                entry.notes = "Skipped after an earlier verification failure."
    except VerificationError as exc:
        message = str(exc)
        failed = False
        for entry in tests.values():
            if entry.status == "pending" and not failed:
                record_failure(
                    entry,
                    output=message,
                    cause=message.splitlines()[0],
                    impact="A required verification step failed.",
                )
                failed = True
            elif entry.status == "pending":
                entry.status = "skipped"
                entry.notes = "Skipped after an earlier verification failure."
    finally:
        git_commit = (
            subprocess.run(
                ["git", "rev-parse", "HEAD"],
                cwd=REPO_ROOT,
                check=False,
                capture_output=True,
                text=True,
            ).stdout.strip()
            or "<unknown>"
        )
        json_report = build_json_report(
            package=args.package,
            version=args.version,
            index=args.test_index_url,
            artifact=artifact_info,
            tests=tests,
            git_commit=git_commit,
        )
        markdown_report = build_markdown_report(json_report)
        args.report.write_text(markdown_report, encoding="utf8")
        args.json_report.write_text(
            json.dumps(json_report, indent=2, sort_keys=True) + "\n",
            encoding="utf8",
        )
        if not args.keep_environments:
            workspace_context.cleanup()
        else:
            print(f"Preserved temporary verification workspace: {workspace}")

    return json_report


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Verify an OllowEditor release downloaded from TestPyPI."
    )
    parser.add_argument("--package", required=True, type=validate_package_name)
    parser.add_argument("--version", required=True, type=validate_version)
    parser.add_argument(
        "--test-index-url",
        default="https://test.pypi.org/simple/",
    )
    parser.add_argument(
        "--production-index-url",
        default="https://pypi.org/simple/",
    )
    parser.add_argument("--keep-environments", action="store_true")
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--json-report", type=Path, default=DEFAULT_JSON_REPORT)
    parser.add_argument("--skip-browser", action="store_true")
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    report = run_real_verification(args)
    result = report["result"]
    print(
        "GO — TestPyPI verification passed"
        if result == "passed"
        else "NO-GO — TestPyPI verification failed"
    )
    return 0 if result == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
