from __future__ import annotations

from rest_framework import serializers

from olloweditor.integrations.drf import OllowEditorHTMLField

from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    content = OllowEditorHTMLField(allow_blank=True)

    class Meta:
        model = Article
        fields = ["id", "title", "content", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
