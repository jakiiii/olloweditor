from __future__ import annotations

from django.db import models

from olloweditor.integrations.django import OllowEditorField


class Article(models.Model):
    title = models.CharField(max_length=255)
    content = OllowEditorField()
    summary = models.TextField(blank=True)


class DualArticle(models.Model):
    title = models.CharField(max_length=255)
    primary_content = OllowEditorField()
    secondary_content = OllowEditorField(blank=True)
