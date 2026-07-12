from __future__ import annotations

from django.core.files.base import ContentFile
from django.core.files.storage import Storage


class InMemoryStorage(Storage):
    files: dict[str, bytes] = {}

    @classmethod
    def reset(cls) -> None:
        cls.files = {}

    def _open(self, name: str, mode: str = "rb") -> ContentFile:
        return ContentFile(self.files[name], name=name)

    def _save(self, name: str, content: ContentFile) -> str:
        content.seek(0)
        self.files[name] = content.read()
        return name

    def delete(self, name: str) -> None:
        self.files.pop(name, None)

    def exists(self, name: str) -> bool:
        return name in self.files

    def size(self, name: str) -> int:
        return len(self.files[name])

    def url(self, name: str) -> str:
        return f"/memory-media/{name}"
