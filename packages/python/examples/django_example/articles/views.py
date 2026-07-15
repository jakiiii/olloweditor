from __future__ import annotations

from django.contrib import messages
from django.urls import reverse, reverse_lazy
from django.views.generic import CreateView, DetailView, ListView, UpdateView

from .forms import ArticleForm
from .models import Article


class ArticleListView(ListView):
    model = Article
    template_name = "articles/list.html"
    context_object_name = "articles"


class ArticleCreateView(CreateView):
    model = Article
    form_class = ArticleForm
    template_name = "articles/form.html"

    def form_valid(self, form: ArticleForm):
        messages.success(self.request, "Article saved.")
        return super().form_valid(form)


class ArticleUpdateView(UpdateView):
    model = Article
    form_class = ArticleForm
    template_name = "articles/form.html"

    def form_valid(self, form: ArticleForm):
        messages.success(self.request, "Article updated.")
        return super().form_valid(form)

    def get_success_url(self) -> str:
        return reverse("article-detail", kwargs={"pk": self.object.pk})


class ArticleDetailView(DetailView):
    model = Article
    template_name = "articles/detail.html"


ArticleCreateView.success_url = reverse_lazy("article-list")
