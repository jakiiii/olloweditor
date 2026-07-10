from __future__ import annotations

from dataclasses import dataclass

from flask import Flask, redirect, render_template, request, url_for

from olloweditor.integrations.flask import OllowEditor


@dataclass
class Article:
    id: int
    title: str
    content: str


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "flask-example-not-for-production"
    OllowEditor(app)
    app.config["ARTICLES"] = []

    @app.get("/")
    def index():
        return render_template("form.html", errors={}, title="", content="")

    @app.post("/articles")
    def create_article():
        title = request.form.get("title", "").strip()
        content = request.form.get("content", "")
        errors: dict[str, str] = {}
        if not title:
            errors["title"] = "Title is required."
        if not content.strip():
            errors["content"] = "Content is required."
        if errors:
            return (
                render_template("form.html", errors=errors, title=title, content=content),
                400,
            )

        articles: list[Article] = app.config["ARTICLES"]
        article = Article(id=len(articles) + 1, title=title, content=content)
        articles.append(article)
        return redirect(url_for("article_detail", article_id=article.id))

    @app.get("/articles/<int:article_id>")
    def article_detail(article_id: int):
        articles: list[Article] = app.config["ARTICLES"]
        article = next((item for item in articles if item.id == article_id), None)
        if article is None:
            return "Article not found.", 404
        return render_template("detail.html", article=article)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
