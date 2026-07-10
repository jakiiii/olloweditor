from __future__ import annotations

from django.shortcuts import render
from rest_framework import generics

from .models import Article
from .serializers import ArticleSerializer


def index(request):
    articles = Article.objects.all()[:5]
    return render(request, "articles/index.html", {"articles": articles})


class ArticleListCreateAPIView(generics.ListCreateAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer


class ArticleRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
