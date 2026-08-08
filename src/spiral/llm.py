from __future__ import annotations

from typing import Any

from spiral.config import Config
from spiral.providers import create_provider


class LLMClient:
    def __init__(self, config: Config):
        self.config = config
        self.provider = create_provider(config)

    def chat(
        self, messages: list[dict[str, str]], tools: list[dict[str, Any]] | None = None
    ) -> dict[str, Any]:
        return self.provider.chat(messages, tools)

    def generate(self, prompt: str, system: str = "") -> str:
        return self.provider.generate(prompt, system)

    def chat_stream(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
        callback: Any | None = None,
    ) -> dict[str, Any]:
        return self.provider.chat_stream(messages, tools, callback)

    def extract_json(self, text: str) -> Any | None:
        return self.provider.extract_json(text)
