from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from olloweditor.integrations.fastapi import OllowEditorFastAPI


@dataclass
class Article:
    id: int
    title: str
    content: str


def create_app() -> FastAPI:
    app = FastAPI()
    app.state.articles = []

    templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))
    integration = OllowEditorFastAPI(
        uploads_enabled=True,
        auth_required=False,
        upload_root=str(Path(__file__).parent / "media"),
        media_url="/uploads/",
    )
    integration.init_app(app, templates=templates)

    @app.get("/", response_class=HTMLResponse)
    async def index(request: Request) -> HTMLResponse:
        return templates.TemplateResponse(
            request,
            "form.html",
            {
                "request": request,
                "articles": app.state.articles,
                "errors": {},
                "title": "",
                "content": "",
            },
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
                {
                    "request": request,
                    "articles": app.state.articles,
                    "errors": errors,
                    "title": title,
                    "content": content,
                },
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
