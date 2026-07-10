from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from olloweditor.integrations.fastapi import mount_olloweditor, olloweditor_assets, olloweditor_textarea


@dataclass
class Article:
    id: int
    title: str
    content: str


def create_app() -> FastAPI:
    app = FastAPI()
    mount_olloweditor(app)
    app.state.articles = []

    templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))
    templates.env.globals["olloweditor_assets"] = olloweditor_assets
    templates.env.globals["olloweditor_textarea"] = olloweditor_textarea
    app.state.templates = templates

    @app.get("/", response_class=HTMLResponse)
    async def index(request: Request) -> HTMLResponse:
        return templates.TemplateResponse(
            request,
            "form.html",
            {"request": request, "errors": {}, "title": "", "content": ""},
        )

    @app.post("/articles", response_class=HTMLResponse)
    async def create_article(request: Request):
        form = await request.form()
        title = str(form.get("title", "")).strip()
        content = str(form.get("content", ""))
        errors: dict[str, str] = {}
        if not title:
            errors["title"] = "Title is required."
        if not content.strip():
            errors["content"] = "Content is required."
        if errors:
            return templates.TemplateResponse(
                request,
                "form.html",
                {"request": request, "errors": errors, "title": title, "content": content},
                status_code=400,
            )

        articles: list[Article] = app.state.articles
        article = Article(id=len(articles) + 1, title=title, content=content)
        articles.append(article)
        return RedirectResponse(url=f"/articles/{article.id}", status_code=303)

    @app.get("/articles/{article_id}", response_class=HTMLResponse)
    async def article_detail(request: Request, article_id: int) -> HTMLResponse:
        articles: list[Article] = app.state.articles
        article = next((item for item in articles if item.id == article_id), None)
        if article is None:
            return HTMLResponse("Article not found.", status_code=404)
        return templates.TemplateResponse(
            request,
            "detail.html",
            {"request": request, "article": article},
        )

    return app


app = create_app()
