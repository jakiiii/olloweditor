from __future__ import annotations

import json
from collections.abc import Awaitable, Callable, Mapping
from typing import Any, cast
from urllib.parse import urlparse

from markupsafe import Markup, escape

from olloweditor.previews import extract_olloweditor_text
from olloweditor.uploads import (
    GenericUploadSettings,
    LocalFilesystemUploadStorage,
    UploadStorageProtocol,
    UploadValidationError,
    build_upload_options,
    error_payload,
    gallery_payload,
    save_gallery_uploads,
    save_validated_upload,
    single_file_payload,
    validate_attachment_upload,
    validate_gallery_count,
    validate_image_upload,
)

try:
    from fastapi import APIRouter, Depends, FastAPI, HTTPException, UploadFile
    from starlette.routing import Mount
    from starlette.staticfiles import StaticFiles
except ModuleNotFoundError as exc:  # pragma: no cover - exercised elsewhere
    if exc.name and exc.name.split(".")[0] in {"fastapi", "starlette"}:
        raise ImportError(
            "The OllowEditor FastAPI integration requires FastAPI and Starlette. "
            'Install it with `pip install "olloweditor[fastapi]"`.'
        ) from exc
    raise


AuthDependency = Callable[[], Awaitable[Any] | Any]


def _normalize_mount_path(path: str) -> str:
    if not isinstance(path, str):
        raise TypeError("Mount path must be a string.")

    normalized = path.strip()
    if not normalized:
        raise ValueError("Mount path must not be empty.")
    if not normalized.startswith("/"):
        raise ValueError(f"Mount path must start with '/': {path!r}")
    if normalized == "/":
        raise ValueError("Mount path must not be the application root.")

    normalized = normalized.rstrip("/") or "/"
    if "//" in normalized:
        raise ValueError(f"Mount path must not contain empty path segments: {path!r}")

    return normalized


def mount_olloweditor(
    app: FastAPI,
    path: str = "/olloweditor/static",
    name: str = "olloweditor_static",
) -> str:
    mount_path = _normalize_mount_path(path)

    for route in app.router.routes:
        if isinstance(route, Mount):
            if route.path == mount_path and route.name == name:
                return mount_path
            if route.path == mount_path:
                raise ValueError(
                    "Mount path "
                    f"{mount_path!r} is already registered with name {route.name!r}."
                )
            if route.name == name:
                raise ValueError(
                    f"Mount name {name!r} is already registered "
                    f"for path {route.path!r}."
                )

    app.mount(
        mount_path,
        StaticFiles(packages=[("olloweditor", "static/olloweditor")], check_dir=False),
        name=name,
    )
    return mount_path


def olloweditor_assets(path: str = "/olloweditor/static") -> Markup:
    mount_path = _normalize_mount_path(path)
    html = (
        f'<link rel="stylesheet" href="{escape(f"{mount_path}/olloweditor.css")}">\n'
        f'<script src="{escape(f"{mount_path}/olloweditor.browser.js")}"></script>\n'
        f'<script src="{escape(f"{mount_path}/olloweditor-init.js")}"></script>'
    )
    return Markup(html)


def olloweditor_textarea(
    name: str,
    value: str = "",
    *,
    id: str | None = None,
    options: Mapping[str, Any] | None = None,
    attrs: Mapping[str, Any] | None = None,
) -> Markup:
    attributes: dict[str, Any] = dict(attrs or {})
    attributes["name"] = name
    if id is not None:
        attributes["id"] = id
    attributes["data-olloweditor"] = "true"
    if options:
        attributes["data-olloweditor-options"] = json.dumps(
            dict(options), ensure_ascii=True, separators=(",", ":")
        )

    rendered_attrs = " ".join(
        f'{escape(str(key))}="{escape(str(val))}"'
        for key, val in attributes.items()
        if val is not None
    )
    html = f"<textarea {rendered_attrs}>{escape(value)}</textarea>"
    return Markup(html)


class OllowEditorFastAPI:
    def __init__(
        self,
        *,
        static_path: str = "/olloweditor/static",
        static_name: str = "olloweditor_static",
        upload_prefix: str = "/olloweditor/upload",
        uploads_enabled: bool = False,
        upload_root: str = "./olloweditor-media",
        media_url: str = "/olloweditor/media/",
        storage: UploadStorageProtocol | None = None,
        upload_settings: GenericUploadSettings | None = None,
        auth_required: bool = True,
        auth_dependency: AuthDependency | None = None,
        permission_dependency: AuthDependency | None = None,
    ) -> None:
        self.static_path = _normalize_mount_path(static_path)
        self.static_name = static_name
        self.upload_prefix = _normalize_mount_path(upload_prefix)
        self.uploads_enabled = uploads_enabled
        self.upload_settings = upload_settings or GenericUploadSettings()
        self.auth_required = auth_required
        self.auth_dependency = auth_dependency
        self.permission_dependency = permission_dependency
        self.storage = cast(
            UploadStorageProtocol,
            storage
            or LocalFilesystemUploadStorage(
                root_dir=upload_root,
                base_url=media_url,
            ),
        )
        self.media_url = media_url

    def init_app(self, app: FastAPI, *, templates: Any | None = None) -> None:
        mount_olloweditor(app, path=self.static_path, name=self.static_name)
        if self.uploads_enabled:
            app.include_router(self._build_router(), prefix=self.upload_prefix)
            self._mount_local_media(app)
        if templates is not None:
            self.install_templates(templates)

    def install_templates(self, templates: Any) -> None:
        upload_options = self._build_upload_options() if self.uploads_enabled else {}
        templates.env.globals["extract_olloweditor_text"] = extract_olloweditor_text
        templates.env.globals["olloweditor_assets"] = lambda: olloweditor_assets(
            self.static_path
        )
        templates.env.globals["olloweditor_textarea"] = (
            lambda name, value="", **kwargs: olloweditor_textarea(
                name,
                value,
                options=self._merge_options(
                    kwargs.pop("options", None),
                    upload_options,
                ),
                **kwargs,
            )
        )

    def _build_router(self) -> APIRouter:
        router = APIRouter()

        async def require_access() -> None:
            if not self.uploads_enabled:
                raise HTTPException(
                    status_code=403,
                    detail=error_payload(
                        "uploads_disabled",
                        "OllowEditor uploads are disabled.",
                    ),
                )
            if self.auth_required:
                if self.auth_dependency is None:
                    raise HTTPException(
                        status_code=401,
                        detail=error_payload(
                            "authentication_required",
                            "You must be logged in to upload files.",
                        ),
                    )
                authenticated = await _maybe_await(self.auth_dependency())
                if authenticated is False:
                    raise HTTPException(
                        status_code=401,
                        detail=error_payload(
                            "authentication_required",
                            "You must be logged in to upload files.",
                        ),
                    )
            if self.permission_dependency is not None:
                allowed = await _maybe_await(self.permission_dependency())
                if allowed is False:
                    raise HTTPException(
                        status_code=403,
                        detail=error_payload(
                            "permission_denied",
                            "You do not have permission to upload files.",
                        ),
                    )

        @router.post("/image/")
        async def upload_image(
            file: UploadFile,
            _: None = Depends(require_access),
        ) -> dict[str, object]:
            try:
                validated = validate_image_upload(
                    file.file,
                    filename=file.filename or "",
                    file_size=_upload_file_size(file),
                    content_type=file.content_type,
                    config=self.upload_settings,
                )
                saved = save_validated_upload(
                    validated,
                    upload_type="image",
                    config=self.upload_settings,
                    storage=self.storage,
                )
            except UploadValidationError as exc:
                raise _http_from_upload_error(exc) from exc
            return single_file_payload("image", saved)

        @router.post("/gallery/")
        async def upload_gallery(
            files: list[UploadFile],
            _: None = Depends(require_access),
        ) -> dict[str, object]:
            try:
                validate_gallery_count(
                    len(files),
                    self.upload_settings.max_gallery_files,
                )
                validated_files = [
                    validate_image_upload(
                        item.file,
                        filename=item.filename or "",
                        file_size=_upload_file_size(item),
                        content_type=item.content_type,
                        config=self.upload_settings,
                    )
                    for item in files
                ]
                uploads = save_gallery_uploads(
                    validated_files,
                    config=self.upload_settings,
                    storage=self.storage,
                )
            except UploadValidationError as exc:
                raise _http_from_upload_error(exc) from exc
            return gallery_payload(uploads)

        @router.post("/attachment/")
        async def upload_attachment(
            file: UploadFile,
            _: None = Depends(require_access),
        ) -> dict[str, object]:
            try:
                validated = validate_attachment_upload(
                    file.file,
                    filename=file.filename or "",
                    file_size=_upload_file_size(file),
                    content_type=file.content_type,
                    config=self.upload_settings,
                )
                saved = save_validated_upload(
                    validated,
                    upload_type="attachment",
                    config=self.upload_settings,
                    storage=self.storage,
                )
            except UploadValidationError as exc:
                raise _http_from_upload_error(exc) from exc
            return single_file_payload("attachment", saved)

        return router

    def _mount_local_media(self, app: FastAPI) -> None:
        if not isinstance(self.storage, LocalFilesystemUploadStorage):
            return
        parsed = urlparse(self.media_url)
        if parsed.scheme or parsed.netloc:
            return
        mount_olloweditor(
            app,
            path=_normalize_mount_path(parsed.path),
            name="olloweditor_media",
        )
        for route in app.router.routes:
            if isinstance(route, Mount) and route.name == "olloweditor_media":
                route.app = StaticFiles(
                    directory=str(self.storage.root_dir),
                    check_dir=False,
                )
                return

    def _build_upload_options(self) -> dict[str, object]:
        return build_upload_options(
            image_url=f"{self.upload_prefix}/image/",
            gallery_url=f"{self.upload_prefix}/gallery/",
            attachment_url=f"{self.upload_prefix}/attachment/",
        )

    @staticmethod
    def _merge_options(
        options: Mapping[str, Any] | None,
        upload_options: Mapping[str, Any],
    ) -> dict[str, Any]:
        merged = dict(options or {})
        if not upload_options:
            return merged
        nested_upload = dict(upload_options.get("upload", {}))
        nested_upload.update(dict(merged.get("upload", {})))
        merged.update(upload_options)
        merged["upload"] = nested_upload
        return merged


async def _maybe_await(value: Any) -> Any:
    if hasattr(value, "__await__"):
        return await value
    return value


def _http_from_upload_error(exc: UploadValidationError) -> HTTPException:
    return HTTPException(
        status_code=exc.status,
        detail=error_payload(exc.code, exc.message),
    )


def _upload_file_size(upload_file: UploadFile) -> int:
    current = upload_file.file.tell()
    upload_file.file.seek(0, 2)
    size = upload_file.file.tell()
    upload_file.file.seek(current)
    return int(size)
