from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

PYTHON_DIR = Path(__file__).resolve().parents[1]
EXAMPLES_DIR = PYTHON_DIR / "examples"
PYTHON_BIN = Path(sys.executable)


def _run_example_snippet(
    example_dir: Path, snippet: str
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(PYTHON_DIR / "src")
    return subprocess.run(
        [str(PYTHON_BIN), "-c", snippet],
        cwd=example_dir,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )


def test_django_example_smoke() -> None:
    result = _run_example_snippet(
        EXAMPLES_DIR / "django_example",
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
assert client.get("/static/olloweditor/olloweditor.css").status_code == 200
print("ok")
""",
    )
    assert result.stdout.strip() == "ok"


def test_drf_example_smoke() -> None:
    result = _run_example_snippet(
        EXAMPLES_DIR / "drf_example",
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
assert client.get("/static/olloweditor/olloweditor.css").status_code == 200
assert client.get("/api/olloweditor/upload/image/").status_code == 405
response = client.post(
    "/api/articles/",
    data='{"title":"Example","content":"<p>Saved</p>"}',
    content_type="application/json",
)
assert response.status_code == 201
print("ok")
""",
    )
    assert result.stdout.strip() == "ok"


def test_flask_example_smoke() -> None:
    result = _run_example_snippet(
        EXAMPLES_DIR / "flask_example",
        """
from app import create_app
from io import BytesIO
from PIL import Image
app = create_app()
client = app.test_client()
assert client.get("/").status_code == 200
assert client.get("/olloweditor/olloweditor.css").status_code == 200
buffer = BytesIO()
Image.new("RGB", (8, 8), (10, 20, 30)).save(buffer, format="PNG")
buffer.seek(0)
upload = client.post(
    "/olloweditor/upload/image/",
    data={"file": (buffer, "example.png")},
    content_type="multipart/form-data",
)
assert upload.status_code == 200
response = client.post(
    "/articles",
    data={"title": "Example", "content": "<p>Saved</p>"},
)
assert response.status_code == 302
print("ok")
""",
    )
    assert result.stdout.strip() == "ok"


def test_fastapi_example_smoke() -> None:
    result = _run_example_snippet(
        EXAMPLES_DIR / "fastapi_example",
        """
from fastapi.testclient import TestClient
from io import BytesIO
from PIL import Image
from main import create_app
app = create_app()
client = TestClient(app)
assert client.get("/").status_code == 200
assert client.get("/olloweditor/static/olloweditor.css").status_code == 200
buffer = BytesIO()
Image.new("RGB", (8, 8), (10, 20, 30)).save(buffer, format="PNG")
buffer.seek(0)
upload = client.post(
    "/olloweditor/upload/image/",
    files={"file": ("example.png", buffer, "image/png")},
)
assert upload.status_code == 200
response = client.post(
    "/articles",
    data={"title": "Example", "content": "<p>Saved</p>"},
    follow_redirects=False,
)
assert response.status_code == 303
print("ok")
""",
    )
    assert result.stdout.strip() == "ok"
