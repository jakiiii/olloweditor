from __future__ import annotations

from django.contrib import admin

from olloweditor.integrations.django.admin import (
    OllowEditorAdminPreviewMedia,
    render_olloweditor_admin_preview,
)

from .models import Article


@admin.register(Article)
class ArticleAdmin(OllowEditorAdminPreviewMedia, admin.ModelAdmin):
    list_display = ("title", "content_preview")
    search_fields = ("title", "content")

    @admin.display(
        description="Content",
        ordering="content",
        empty_value="—",
    )
    def content_preview(self, obj: Article) -> str:
        return render_olloweditor_admin_preview(obj.content)
