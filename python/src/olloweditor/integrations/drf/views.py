from __future__ import annotations

from django.core.files.storage import default_storage
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from olloweditor.integrations.django.settings import get_olloweditor_upload_settings
from olloweditor.uploads import (
    UploadValidationError,
    error_payload,
    gallery_payload,
    save_gallery_uploads,
    save_validated_upload,
    single_file_payload,
    validate_attachment_upload,
    validate_gallery_count,
    validate_image_upload,
)


class _DjangoStorageAdapter:
    def save(self, *, file, path: str, content_type: str | None) -> str:
        del content_type
        saved_name = default_storage.save(path, file)
        return default_storage.url(saved_name)

    def delete(self, path: str) -> None:
        default_storage.delete(path)


class OllowEditorBaseUploadView(APIView):
    authentication_classes = APIView.authentication_classes
    parser_classes = [MultiPartParser, FormParser]
    permission_classes: list[type[permissions.BasePermission]] = []

    def get_permissions(self):
        config = get_olloweditor_upload_settings()
        permission_classes = list(getattr(self, "permission_classes", []))
        if not permission_classes:
            permission_classes = (
                [permissions.IsAuthenticated]
                if config.upload_require_login
                else [permissions.AllowAny]
            )
        return [permission() for permission in permission_classes]

    def get_upload_config(self):
        return get_olloweditor_upload_settings()

    def enforce_upload_permission(self, request) -> Response | None:
        permission_name = self.get_upload_config().upload_permission
        if permission_name and not request.user.has_perm(permission_name):
            return Response(
                error_payload(
                    "permission_denied",
                    "You do not have permission to upload files.",
                ),
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def uploads_enabled_response(self) -> Response | None:
        if not self.get_upload_config().uploads_enabled:
            return Response(
                error_payload(
                    "uploads_disabled",
                    "OllowEditor uploads are disabled.",
                ),
                status=status.HTTP_403_FORBIDDEN,
            )
        return None


class OllowEditorImageUploadView(OllowEditorBaseUploadView):
    def post(self, request):
        disabled = self.uploads_enabled_response()
        if disabled is not None:
            return disabled

        permission_response = self.enforce_upload_permission(request)
        if permission_response is not None:
            return permission_response

        uploaded_file = request.FILES.get("file") or request.FILES.get("image")
        if uploaded_file is None:
            return Response(
                error_payload("missing_file", "A file is required."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validated = validate_image_upload(
                uploaded_file,
                filename=str(getattr(uploaded_file, "name", "")),
                file_size=int(getattr(uploaded_file, "size", 0)),
                content_type=getattr(uploaded_file, "content_type", None),
                config=self.get_upload_config(),
            )
            saved = save_validated_upload(
                validated,
                upload_type="image",
                config=self.get_upload_config(),
                storage=_DjangoStorageAdapter(),
            )
        except UploadValidationError as exc:
            return Response(
                error_payload(exc.code, exc.message),
                status=exc.status,
            )

        return Response(single_file_payload("image", saved))


class OllowEditorGalleryUploadView(OllowEditorBaseUploadView):
    def post(self, request):
        disabled = self.uploads_enabled_response()
        if disabled is not None:
            return disabled

        permission_response = self.enforce_upload_permission(request)
        if permission_response is not None:
            return permission_response

        files = request.FILES.getlist("files")
        config = self.get_upload_config()
        try:
            validate_gallery_count(len(files), config.max_gallery_files)
            validated_files = [
                validate_image_upload(
                    uploaded_file,
                    filename=str(getattr(uploaded_file, "name", "")),
                    file_size=int(getattr(uploaded_file, "size", 0)),
                    content_type=getattr(uploaded_file, "content_type", None),
                    config=config,
                )
                for uploaded_file in files
            ]
            uploads = save_gallery_uploads(
                validated_files,
                config=config,
                storage=_DjangoStorageAdapter(),
            )
        except UploadValidationError as exc:
            return Response(error_payload(exc.code, exc.message), status=exc.status)

        return Response(gallery_payload(uploads))


class OllowEditorAttachmentUploadView(OllowEditorBaseUploadView):
    def post(self, request):
        disabled = self.uploads_enabled_response()
        if disabled is not None:
            return disabled

        permission_response = self.enforce_upload_permission(request)
        if permission_response is not None:
            return permission_response

        uploaded_file = request.FILES.get("file")
        if uploaded_file is None:
            return Response(
                error_payload("missing_file", "A file is required."),
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validated = validate_attachment_upload(
                uploaded_file,
                filename=str(getattr(uploaded_file, "name", "")),
                file_size=int(getattr(uploaded_file, "size", 0)),
                content_type=getattr(uploaded_file, "content_type", None),
                config=self.get_upload_config(),
            )
            saved = save_validated_upload(
                validated,
                upload_type="attachment",
                config=self.get_upload_config(),
                storage=_DjangoStorageAdapter(),
            )
        except UploadValidationError as exc:
            return Response(
                error_payload(exc.code, exc.message),
                status=exc.status,
            )

        return Response(single_file_payload("attachment", saved))
