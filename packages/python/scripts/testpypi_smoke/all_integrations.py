from __future__ import annotations

from common import emit, ensure_installed_package, installed_distributions, venv_prefix


def main() -> None:
    package_info = ensure_installed_package()

    from olloweditor.integrations.django import OllowEditorField, OllowEditorWidget
    from olloweditor.integrations.drf import OllowEditorHTMLField
    from olloweditor.integrations.fastapi import mount_olloweditor, olloweditor_assets
    from olloweditor.integrations.flask import OllowEditor

    distributions = installed_distributions()

    emit(
        {
            "checks": {
                "base_import": True,
                "django_imports": [
                    OllowEditorField.__name__,
                    OllowEditorWidget.__name__,
                ],
                "drf_import": OllowEditorHTMLField.__name__,
                "fastapi_imports": [
                    mount_olloweditor.__name__,
                    olloweditor_assets.__name__,
                ],
                "flask_import": OllowEditor.__name__,
            },
            "framework_versions": {
                "django": distributions.get("django"),
                "djangorestframework": distributions.get("djangorestframework"),
                "flask": distributions.get("flask"),
                "fastapi": distributions.get("fastapi"),
            },
            "package": package_info,
            "venv_prefix": venv_prefix(),
        }
    )


if __name__ == "__main__":
    main()
