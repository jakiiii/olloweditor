from __future__ import annotations

from django.db import models

from olloweditor.integrations.django import OllowEditorField


class Article(models.Model):
    title = models.CharField(max_length=255)
    content = OllowEditorField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.title
