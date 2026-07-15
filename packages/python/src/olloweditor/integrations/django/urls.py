from __future__ import annotations

from django.urls import path

from .upload_views import (
    upload_attachment_view,
    upload_gallery_view,
    upload_image_view,
)

app_name = "olloweditor"

urlpatterns = [
    path("upload/image/", upload_image_view, name="upload_image"),
    path("upload/gallery/", upload_gallery_view, name="upload_gallery"),
    path("upload/attachment/", upload_attachment_view, name="upload_attachment"),
]
