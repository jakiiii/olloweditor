from __future__ import annotations

from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image

from olloweditor.uploads import (
    GenericUploadSettings,
    LocalFilesystemUploadStorage,
    UploadValidationError,
    build_upload_options,
    save_gallery_uploads,
    validate_attachment_upload,
    validate_image_upload,
    validate_relative_upload_path,
)


def _png_bytes(name: str = "image.png") -> BytesIO:
    buffer = BytesIO()
    Image.new("RGB", (8, 8), (10, 20, 30)).save(buffer, format="PNG")
    buffer.seek(0)
    buffer.name = name
    return buffer


def test_validate_relative_upload_path_rejects_traversal() -> None:
    try:
        validate_relative_upload_path("../unsafe/path")
    except UploadValidationError as exc:
        assert exc.code == "invalid_path"
    else:
        raise AssertionError("Expected path traversal to be rejected.")


def test_validate_image_upload_accepts_real_image_content() -> None:
    upload = validate_image_upload(
        _png_bytes(),
        filename="photo.png",
        file_size=77,
        content_type="image/png",
        config=GenericUploadSettings(),
    )
    assert upload.extension == "png"
    assert upload.name == "photo.png"


def test_validate_attachment_upload_rejects_blocked_extension() -> None:
    try:
        validate_attachment_upload(
            BytesIO(b"console.log('x')"),
            filename="script.js",
            file_size=16,
            content_type="application/javascript",
            config=GenericUploadSettings(),
        )
    except UploadValidationError as exc:
        assert exc.code == "invalid_file_type"
    else:
        raise AssertionError("Expected attachment validation to reject .js.")


def test_local_filesystem_storage_returns_public_url() -> None:
    with TemporaryDirectory() as tmpdir:
        storage = LocalFilesystemUploadStorage(
            root_dir=tmpdir,
            base_url="/media/",
        )
        file_obj = _png_bytes()
        url = storage.save(
            file=file_obj,
            path="olloweditor/images/test.png",
            content_type="image/png",
        )
        assert url == "/media/olloweditor/images/test.png"
        assert (Path(tmpdir) / "olloweditor/images/test.png").exists()


def test_gallery_cleanup_removes_partially_saved_files() -> None:
    saved_paths: list[str] = []

    class FailingStorage(LocalFilesystemUploadStorage):
        def __init__(self, root_dir: str) -> None:
            super().__init__(root_dir=root_dir, base_url="/media/")
            self._calls = 0

        def save(self, *, file, path: str, content_type: str | None) -> str:
            self._calls += 1
            if self._calls == 2:
                raise RuntimeError("boom")
            saved_paths.append(path)
            return super().save(file=file, path=path, content_type=content_type)

    with TemporaryDirectory() as tmpdir:
        storage = FailingStorage(tmpdir)
        try:
            save_gallery_uploads(
                [
                    validate_image_upload(
                        _png_bytes("one.png"),
                        filename="one.png",
                        file_size=77,
                        content_type="image/png",
                        config=GenericUploadSettings(),
                    ),
                    validate_image_upload(
                        _png_bytes("two.png"),
                        filename="two.png",
                        file_size=77,
                        content_type="image/png",
                        config=GenericUploadSettings(),
                    ),
                ],
                config=GenericUploadSettings(),
                storage=storage,
            )
        except UploadValidationError as exc:
            assert exc.code == "storage_failure"
        else:
            raise AssertionError("Expected gallery storage failure.")

        assert saved_paths
        for path in saved_paths:
            assert not (Path(tmpdir) / path).exists()


def test_build_upload_options_disables_base64_and_fallback() -> None:
    options = build_upload_options(
        image_url="/upload/image/",
        gallery_url="/upload/gallery/",
        attachment_url="/upload/attachment/",
    )
    assert options["upload"]["allowBase64"] is False
    assert options["upload"]["allowFallback"] is False
