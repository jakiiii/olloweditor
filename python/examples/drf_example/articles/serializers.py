from __future__ import annotations

from rest_framework import serializers

from olloweditor.integrations.drf import OllowEditorHTMLField
from olloweditor.previews import extract_olloweditor_text

from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    content = OllowEditorHTMLField(allow_blank=True)
    preview = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ["id", "title", "content", "preview", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_preview(self, obj: Article) -> str:
        return extract_olloweditor_text(obj.content, max_length=140)
