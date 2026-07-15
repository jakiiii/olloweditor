from __future__ import annotations

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = "django-example-not-for-production"
DEBUG = True
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "olloweditor.apps.OllowEditorConfig",
    "articles",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "django_site.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

WSGI_APPLICATION = "django_site.wsgi.application"
ASGI_APPLICATION = "django_site.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

OLLOWEDITOR = {
    "UPLOADS_ENABLED": True,
    "UPLOAD_REQUIRE_LOGIN": True,
    "IMAGE_UPLOAD_PATH": "olloweditor/images/%Y/%m/",
    "GALLERY_UPLOAD_PATH": "olloweditor/gallery/%Y/%m/",
    "ATTACHMENT_UPLOAD_PATH": "olloweditor/attachments/%Y/%m/",
    "MAX_IMAGE_SIZE": 10 * 1024 * 1024,
    "MAX_GALLERY_FILES": 20,
    "MAX_ATTACHMENT_SIZE": 25 * 1024 * 1024,
    "ALLOWED_IMAGE_EXTENSIONS": [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
    ],
    "ALLOWED_ATTACHMENT_EXTENSIONS": [
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "txt",
        "zip",
    ],
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
