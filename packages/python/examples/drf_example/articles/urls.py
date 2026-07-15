from __future__ import annotations

from django.urls import path

from .views import ArticleListCreateAPIView, ArticleRetrieveUpdateAPIView, index

urlpatterns = [
    path("", index, name="index"),
    path(
        "api/articles/", ArticleListCreateAPIView.as_view(), name="article-list-create"
    ),
    path(
        "api/articles/<int:pk>/",
        ArticleRetrieveUpdateAPIView.as_view(),
        name="article-detail",
    ),
]
