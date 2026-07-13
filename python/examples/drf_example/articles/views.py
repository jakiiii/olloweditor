from __future__ import annotations

import json

from django.shortcuts import render
from rest_framework import generics

from olloweditor.integrations.django.settings import get_olloweditor_upload_settings
from olloweditor.previews import extract_olloweditor_text

from .models import Article
from .serializers import ArticleSerializer


def index(request):
    articles = Article.objects.all()[:5]
    for article in articles:
        article.preview = extract_olloweditor_text(article.content, max_length=140)
    upload_options = get_olloweditor_upload_settings().build_widget_upload_options()
    return render(
        request,
        "articles/index.html",
        {
            "articles": articles,
            "upload_options_json": json.dumps(
                upload_options,
                ensure_ascii=True,
                separators=(",", ":"),
            ),
        },
    )


class ArticleListCreateAPIView(generics.ListCreateAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer


class ArticleRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
