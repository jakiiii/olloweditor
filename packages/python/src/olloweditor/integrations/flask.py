from __future__ import annotations

import json
import mimetypes
from collections.abc import Callable, Mapping
from importlib.resources import as_file
from typing import Any
from urllib.parse import urlparse

from markupsafe import Markup, escape

from olloweditor.previews import extract_olloweditor_text
from olloweditor.resources import get_asset_path
from olloweditor.uploads import (
    GenericUploadSettings,
    LocalFilesystemUploadStorage,
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
    from flask import (
        Blueprint,
        Flask,
        abort,
        current_app,
        jsonify,
        request,
        send_from_directory,
        url_for,
    )
    from flask.typing import ResponseReturnValue
except ModuleNotFoundError as exc:  # pragma: no cover - exercised elsewhere
    if exc.name and exc.name.split(".")[0] == "flask":
        raise ImportError(
            "The OllowEditor Flask integration requires Flask. "
            'Install it with `pip install "olloweditor[flask]"`.'
        ) from exc
    raise

AuthCheck = Callable[[], bool]
TokenCallback = Callable[[], str | None]


class OllowEditor:
    """Flask extension that serves OllowEditor assets, uploads, and Jinja helpers."""

    def __init__(
        self,
        app: Flask | None = None,
        *,
        url_prefix: str = "/olloweditor",
    ) -> None:
        self.default_url_prefix = url_prefix
        if app is not None:
            self.init_app(app)

    def init_app(self, app: Flask) -> None:
        existing = app.extensions.get("olloweditor")
        if existing is not None:
            return

        config = self._build_config(app)
        blueprint = Blueprint(
            "olloweditor",
            __name__,
            url_prefix=config["url_prefix"],
        )

        @blueprint.get("/<path:filename>")
        def asset(filename: str) -> ResponseReturnValue:
            try:
                traversable = get_asset_path(filename)
            except (FileNotFoundError, ValueError):
                abort(404)

            mimetype, _ = mimetypes.guess_type(filename)
            with (
                as_file(traversable) as local_path,
                open(local_path, "rb") as asset_file,
            ):
                return current_app.response_class(
                    asset_file.read(),
                    mimetype=mimetype or "application/octet-stream",
                )

        @blueprint.post("/upload/image/")
        def upload_image() -> ResponseReturnValue:
            return self._handle_single_upload("image")

        @blueprint.post("/upload/gallery/")
        def upload_gallery() -> ResponseReturnValue:
            return self._handle_gallery_upload()

        @blueprint.post("/upload/attachment/")
        def upload_attachment() -> ResponseReturnValue:
            return self._handle_single_upload("attachment")

        if blueprint.name not in app.blueprints:
            app.register_blueprint(blueprint)

        media_rule = config["media_rule"]
        if media_rule is not None:
            endpoint = "olloweditor_media"
            if endpoint not in app.view_functions:
                app.add_url_rule(
                    media_rule,
                    endpoint=endpoint,
                    view_func=self._serve_uploaded_media,
                )

        app.extensions["olloweditor"] = self
        app.extensions["olloweditor_config"] = config
        app.jinja_env.globals["extract_olloweditor_text"] = extract_olloweditor_text
        app.jinja_env.globals["olloweditor_assets"] = self._make_assets_helper()
        app.jinja_env.globals["olloweditor_textarea"] = self._make_textarea_helper()

    def _build_config(self, app: Flask) -> dict[str, Any]:
        url_prefix = app.config.get("OLLOWEDITOR_URL_PREFIX", self.default_url_prefix)
        uploads_enabled = bool(app.config.get("OLLOWEDITOR_UPLOADS_ENABLED", False))
        media_url = app.config.get("OLLOWEDITOR_MEDIA_URL", f"{url_prefix}/media/")
        upload_root = app.config.get(
            "OLLOWEDITOR_UPLOAD_ROOT",
            app.instance_path + "/olloweditor-media",
        )
        storage = app.config.get("OLLOWEDITOR_STORAGE")
        if storage is None:
            storage = LocalFilesystemUploadStorage(
                root_dir=upload_root,
                base_url=media_url,
            )

        upload_settings = GenericUploadSettings(
            image_upload_path=app.config.get(
                "OLLOWEDITOR_IMAGE_UPLOAD_PATH",
                "olloweditor/images/%Y/%m/",
            ),
            gallery_upload_path=app.config.get(
                "OLLOWEDITOR_GALLERY_UPLOAD_PATH",
                "olloweditor/gallery/%Y/%m/",
            ),
            attachment_upload_path=app.config.get(
                "OLLOWEDITOR_ATTACHMENT_UPLOAD_PATH",
                "olloweditor/attachments/%Y/%m/",
            ),
            max_image_size=int(
                app.config.get("OLLOWEDITOR_MAX_IMAGE_SIZE", 10 * 1024 * 1024)
            ),
            max_gallery_files=int(app.config.get("OLLOWEDITOR_MAX_GALLERY_FILES", 20)),
            max_attachment_size=int(
                app.config.get("OLLOWEDITOR_MAX_ATTACHMENT_SIZE", 25 * 1024 * 1024)
            ),
            max_image_pixels=int(
                app.config.get("OLLOWEDITOR_MAX_IMAGE_PIXELS", 40_000_000)
            ),
            allowed_image_extensions=tuple(
                app.config.get(
                    "OLLOWEDITOR_ALLOWED_IMAGE_EXTENSIONS",
                    ("jpg", "jpeg", "png", "gif", "webp"),
                )
            ),
            allowed_attachment_extensions=tuple(
                app.config.get(
                    "OLLOWEDITOR_ALLOWED_ATTACHMENT_EXTENSIONS",
                    (
                        "pdf",
                        "doc",
                        "docx",
                        "xls",
                        "xlsx",
                        "ppt",
                        "pptx",
                        "txt",
                        "zip",
                    ),
                )
            ),
        )

        media_rule = self._build_media_rule(
            media_url,
            local_storage=isinstance(storage, LocalFilesystemUploadStorage),
        )
        return {
            "auth_check": app.config.get("OLLOWEDITOR_AUTH_CHECK"),
            "csrf_header_name": app.config.get(
                "OLLOWEDITOR_CSRF_HEADER_NAME",
                "X-CSRFToken",
            ),
            "csrf_token_callback": app.config.get("OLLOWEDITOR_CSRF_TOKEN_CALLBACK"),
            "media_rule": media_rule,
            "permission_check": app.config.get("OLLOWEDITOR_PERMISSION_CHECK"),
            "storage": storage,
            "upload_auth_required": bool(
                app.config.get("OLLOWEDITOR_UPLOAD_AUTH_REQUIRED", True)
            ),
            "upload_permission_required": bool(
                app.config.get("OLLOWEDITOR_UPLOAD_PERMISSION_REQUIRED", False)
            ),
            "upload_settings": upload_settings,
            "uploads_enabled": uploads_enabled,
            "url_prefix": url_prefix,
        }

    @staticmethod
    def _build_media_rule(media_url: str, *, local_storage: bool) -> str | None:
        if not local_storage:
            return None
        parsed = urlparse(media_url)
        if parsed.scheme or parsed.netloc:
            return None
        path = parsed.path.rstrip("/")
        if not path.startswith("/"):
            path = f"/{path}"
        return f"{path}/<path:filename>"

    def _serve_uploaded_media(self, filename: str) -> ResponseReturnValue:
        config = current_app.extensions["olloweditor_config"]
        storage = config["storage"]
        if not isinstance(storage, LocalFilesystemUploadStorage):
            abort(404)
        return send_from_directory(storage.root_dir, filename)

    def _handle_single_upload(self, upload_type: str) -> ResponseReturnValue:
        config = current_app.extensions["olloweditor_config"]
        preflight = self._check_upload_access(config)
        if preflight is not None:
            return preflight

        uploaded_file = request.files.get("file")
        if upload_type == "image" and uploaded_file is None:
            uploaded_file = request.files.get("image")
        if uploaded_file is None:
            return jsonify(error_payload("missing_file", "A file is required.")), 400

        try:
            if upload_type == "attachment":
                validated = validate_attachment_upload(
                    uploaded_file.stream,
                    filename=uploaded_file.filename or "",
                    file_size=self._get_file_size(uploaded_file),
                    content_type=uploaded_file.content_type,
                    config=config["upload_settings"],
                )
            else:
                validated = validate_image_upload(
                    uploaded_file.stream,
                    filename=uploaded_file.filename or "",
                    file_size=self._get_file_size(uploaded_file),
                    content_type=uploaded_file.content_type,
                    config=config["upload_settings"],
                )
            saved = save_validated_upload(
                validated,
                upload_type=upload_type,
                config=config["upload_settings"],
                storage=config["storage"],
            )
        except UploadValidationError as exc:
            return jsonify(error_payload(exc.code, exc.message)), exc.status

        return jsonify(single_file_payload(upload_type, saved))

    def _handle_gallery_upload(self) -> ResponseReturnValue:
        config = current_app.extensions["olloweditor_config"]
        preflight = self._check_upload_access(config)
        if preflight is not None:
            return preflight

        files = request.files.getlist("files")
        try:
            validate_gallery_count(
                len(files),
                config["upload_settings"].max_gallery_files,
            )
            validated_files = [
                validate_image_upload(
                    uploaded_file.stream,
                    filename=uploaded_file.filename or "",
                    file_size=self._get_file_size(uploaded_file),
                    content_type=uploaded_file.content_type,
                    config=config["upload_settings"],
                )
                for uploaded_file in files
            ]
            uploads = save_gallery_uploads(
                validated_files,
                config=config["upload_settings"],
                storage=config["storage"],
            )
        except UploadValidationError as exc:
            return jsonify(error_payload(exc.code, exc.message)), exc.status

        return jsonify(gallery_payload(uploads))

    @staticmethod
    def _get_file_size(uploaded_file: Any) -> int:
        stream = uploaded_file.stream
        current = stream.tell()
        stream.seek(0, 2)
        size = stream.tell()
        stream.seek(current)
        return int(size)

    @staticmethod
    def _check_upload_access(config: Mapping[str, Any]) -> ResponseReturnValue | None:
        if not config["uploads_enabled"]:
            return (
                jsonify(
                    error_payload(
                        "uploads_disabled",
                        "OllowEditor uploads are disabled.",
                    )
                ),
                403,
            )
        if config["upload_auth_required"]:
            auth_check = config["auth_check"]
            if auth_check is None or not bool(auth_check()):
                return (
                    jsonify(
                        error_payload(
                            "authentication_required",
                            "You must be logged in to upload files.",
                        )
                    ),
                    401,
                )
        if config["upload_permission_required"]:
            permission_check = config["permission_check"]
            if permission_check is None or not bool(permission_check()):
                return (
                    jsonify(
                        error_payload(
                            "permission_denied",
                            "You do not have permission to upload files.",
                        )
                    ),
                    403,
                )
        return None

    @staticmethod
    def _make_assets_helper():
        def olloweditor_assets() -> Markup:
            css_url = url_for("olloweditor.asset", filename="olloweditor.css")
            browser_url = url_for(
                "olloweditor.asset", filename="olloweditor.browser.js"
            )
            init_url = url_for("olloweditor.asset", filename="olloweditor-init.js")
            html = (
                f'<link rel="stylesheet" href="{escape(css_url)}">\n'
                f'<script src="{escape(browser_url)}"></script>\n'
                f'<script src="{escape(init_url)}"></script>'
            )
            return Markup(html)

        return olloweditor_assets

    @staticmethod
    def _make_textarea_helper():
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

            merged_options = dict(options or {})
            upload_defaults = _build_flask_upload_options()
            if upload_defaults:
                default_upload = upload_defaults.get("upload", {})
                merged_upload = (
                    dict(default_upload) if isinstance(default_upload, Mapping) else {}
                )
                existing_upload = merged_options.get("upload", {})
                if isinstance(existing_upload, Mapping):
                    merged_upload.update(dict(existing_upload))
                merged_options.update(upload_defaults)
                merged_options["upload"] = merged_upload

            if merged_options:
                attributes["data-olloweditor-options"] = json.dumps(
                    dict(merged_options),
                    ensure_ascii=True,
                    separators=(",", ":"),
                )

            rendered_attrs = " ".join(
                f'{escape(str(key))}="{escape(str(val))}"'
                for key, val in attributes.items()
                if val is not None
            )
            html = f"<textarea {rendered_attrs}>{escape(value)}</textarea>"
            return Markup(html)

        return olloweditor_textarea


def _build_flask_upload_options() -> dict[str, object]:
    config = current_app.extensions["olloweditor_config"]
    if not config["uploads_enabled"]:
        return {}

    token_callback = config.get("csrf_token_callback")
    token_value = token_callback() if callable(token_callback) else None
    return build_upload_options(
        image_url=url_for("olloweditor.upload_image"),
        gallery_url=url_for("olloweditor.upload_gallery"),
        attachment_url=url_for("olloweditor.upload_attachment"),
        csrf_header_name=str(config["csrf_header_name"]),
        csrf_header_value=token_value,
    )
