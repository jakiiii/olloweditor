from __future__ import annotations

from django.urls import path

from .views import (
    ArticleCreateView,
    ArticleDetailView,
    ArticleListView,
    ArticleUpdateView,
)

urlpatterns = [
    path("", ArticleListView.as_view(), name="article-list"),
    path("articles/new/", ArticleCreateView.as_view(), name="article-create"),
    path("articles/<int:pk>/", ArticleDetailView.as_view(), name="article-detail"),
    path("articles/<int:pk>/edit/", ArticleUpdateView.as_view(), name="article-update"),
]
