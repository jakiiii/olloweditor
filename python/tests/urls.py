from __future__ import annotations

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("olloweditor/", include("olloweditor.integrations.django.urls")),
]
