# Changelog

All notable changes to the OllowEditor Python package are documented here.

## 0.1.1 - 2026-07-13

### Django

- Fixed automatic `OllowEditorWidget` selection for `OllowEditorField`,
  including Django admin add and change forms.
- Added storage-backed IMAGE, GALLERY, and ATTACHMENT uploads through Django
  `default_storage`.
- Prevented base64 fallback when Django server uploads are configured.
- Added safe Django admin changelist previews for rich text, images, galleries,
  attachments, and legacy embedded images.

### Django REST Framework

- Improved `OllowEditorHTMLField` validation and sanitizer integration.
- Added reusable multipart IMAGE, GALLERY, and ATTACHMENT upload views.
- Reused Django upload settings, validation, and storage-backed response URLs.
- Added safe plain-text preview support for API list responses.

### Flask

- Added storage-backed IMAGE, GALLERY, and ATTACHMENT upload endpoints to the
  Flask extension.
- Added configurable local storage, custom storage adapters, authentication,
  permission, and CSRF integration hooks.
- Added safe plain-text preview helpers for list and dashboard views.

### FastAPI

- Added `OllowEditorFastAPI` static, template, and upload-router integration.
- Added IMAGE, GALLERY, and ATTACHMENT uploads with configurable storage and
  dependency-based authentication and permission checks.
- Added storage-backed URLs and safe plain-text preview helpers.

### Security

- Added shared size, extension, gallery-count, and upload-path validation.
- Added UUID storage names independent of browser-provided filenames.
- Added Pillow-based image-content, image-format, and pixel-count verification.
- Rejected SVG and executable or active attachment types by default.
- Prevented server-upload failures from silently falling back to base64 or
  `blob:` content.
- Prevented raw stored HTML, scripts, event handlers, and legacy base64 payloads
  from being rendered by Django admin previews.

### Documentation

- Updated installation and integration guidance for Django, DRF, Flask, and
  FastAPI.
- Added upload response, storage adapter, media delivery, and security guidance.
- Added Django admin preview and troubleshooting documentation.
- Updated framework examples for URL-based media uploads and safe previews.

The earlier TestPyPI-only `0.1.1` candidate was metadata-only and is immutable.
The source and artifacts described by this section are the production `0.1.1`
candidate prepared after `0.1.0`.

## 0.1.0 - 2026-07-11

Initial production PyPI release.

### Added

- Packaged OllowEditor browser assets.
- Django `OllowEditorWidget` and `OllowEditorField`.
- Django REST Framework `OllowEditorHTMLField`.
- Flask `OllowEditor` extension.
- FastAPI static and template helpers.
- Framework example applications.
- Automated tests, linting, typing, packaging, and release verification.

### Changed

- Added Python package documentation for GitHub and PyPI users.
- Corrected repository and issue tracker URLs to the current GitHub owner.
- Added standards-compliant MIT license metadata and the packaged license file.

## Historical TestPyPI candidates - 2026-07-11

Versions `0.1.1` and `0.1.2` were previously used on TestPyPI to validate
metadata and publishing workflows. Those TestPyPI artifacts are historical and
do not validate the current production `0.1.1` source tree.
