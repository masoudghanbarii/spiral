from __future__ import annotations

import json
import os
import time
from typing import Any, Protocol

import httpx

from spiral.config import Config


def _with_retry(max_retries: int = 3, backoff: float = 2.0):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(max_retries):
                try:
                    return fn(*args, **kwargs)
                except (
                    httpx.HTTPStatusError,
                    httpx.NetworkError,
                    httpx.TimeoutException,
                ) as exc:
                    last_exc = exc
                    if attempt < max_retries - 1:
                        wait = backoff * (2**attempt)
                        time.sleep(wait)
            raise last_exc

        return wrapper

    return decorator


class LLMProvider(Protocol):
    def chat(
        self, messages: list[dict[str, str]], tools: list[dict[str, Any]] | None = None
    ) -> dict[str, Any]: ...

    def generate(self, prompt: str, system: str = "") -> str: ...

    def chat_stream(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
        callback: Any | None = None,
    ) -> dict[str, Any]: ...

    def extract_json(self, text: str) -> Any | None: ...


class OllamaProvider:
    def __init__(self, config: Config):
        self.base_url = config.OLLAMA_BASE_URL
        self.model = config.MODEL
        self.headers = {
            "Authorization": f"Bearer {config.OLLAMA_API_KEY}",
            "Content-Type": "application/json",
        }

    @_with_retry(max_retries=3, backoff=2.0)
    def chat(
        self, messages: list[dict[str, str]], tools: list[dict[str, Any]] | None = None
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
        }
        if tools:
            payload["tools"] = tools
        with httpx.Client(
            base_url=self.base_url, headers=self.headers, timeout=300
        ) as client:
            resp = client.post("/api/chat", json=payload)
            resp.raise_for_status()
            return resp.json()

    @_with_retry(max_retries=3, backoff=2.0)
    def generate(self, prompt: str, system: str = "") -> str:
        payload: dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False,
        }
        with httpx.Client(
            base_url=self.base_url, headers=self.headers, timeout=300
        ) as client:
            resp = client.post("/api/generate", json=payload)
            resp.raise_for_status()
            return resp.json().get("response", "")

    @_with_retry(max_retries=3, backoff=2.0)
    def chat_stream(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
        callback: Any | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": True,
        }
        if tools:
            payload["tools"] = tools
        full_content = ""
        full_msg: dict[str, Any] = {"content": "", "tool_calls": []}
        with (
            httpx.Client(
                base_url=self.base_url, headers=self.headers, timeout=300
            ) as client,
            client.stream("POST", "/api/chat", json=payload) as resp,
        ):
            resp.raise_for_status()
            for line in resp.iter_lines():
                if not line:
                    continue
                try:
                    chunk = json.loads(line)
                except json.JSONDecodeError:
                    continue
                msg = chunk.get("message", {})
                content = msg.get("content", "")
                if content:
                    full_content += content
                    full_msg["content"] = full_content
                    if callback:
                        callback(content)
                tool_calls = msg.get("tool_calls", [])
                if tool_calls:
                    full_msg["tool_calls"] = tool_calls
                if chunk.get("done", False):
                    break
        return {"message": full_msg}

    def extract_json(self, text: str) -> Any | None:
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        cleaned = cleaned.removesuffix("```")
        cleaned = cleaned.strip()
        try:
            start = cleaned.index("[")
            end = cleaned.rindex("]") + 1
            return json.loads(cleaned[start:end])
        except (ValueError, json.JSONDecodeError):
            pass
        try:
            start = cleaned.index("{")
            end = cleaned.rindex("}") + 1
            return json.loads(cleaned[start:end])
        except (ValueError, json.JSONDecodeError):
            return None


class AnthropicProvider:
    def __init__(self, config: Config):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.model = config.MODEL
        self.base_url = "https://api.anthropic.com"
        self.headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

    def chat(
        self, messages: list[dict[str, str]], tools: list[dict[str, Any]] | None = None
    ) -> dict[str, Any]:
        system = ""
        chat_msgs = []
        for m in messages:
            if m["role"] == "system":
                system += m["content"] + "\n"
            else:
                chat_msgs.append({"role": m["role"], "content": m["content"]})
        payload: dict[str, Any] = {
            "model": self.model,
            "max_tokens": 4096,
            "messages": chat_msgs,
            "system": system,
        }
        with httpx.Client(
            base_url=self.base_url, headers=self.headers, timeout=300
        ) as client:
            resp = client.post("/v1/messages", json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = ""
            for block in data.get("content", []):
                if block.get("type") == "text":
                    content += block.get("text", "")
            return {"message": {"content": content, "tool_calls": []}}

    def generate(self, prompt: str, system: str = "") -> str:
        messages = [{"role": "user", "content": prompt}]
        result = self.chat(
            messages
            if not system
            else [{"role": "system", "content": system}, *messages]
        )
        return result["message"]["content"]

    def chat_stream(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
        callback: Any | None = None,
    ) -> dict[str, Any]:
        return self.chat(messages, tools)

    def extract_json(self, text: str) -> Any | None:
        return OllamaProvider.extract_json(self, text)


class OpenAIProvider:
    def __init__(self, config: Config):
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.model = config.MODEL
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def chat(
        self, messages: list[dict[str, str]], tools: list[dict[str, Any]] | None = None
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
        }
        if tools:
            payload["tools"] = [
                {"type": "function", "function": t["function"]} for t in tools
            ]
        with httpx.Client(
            base_url=self.base_url, headers=self.headers, timeout=300
        ) as client:
            resp = client.post("/v1/chat/completions", json=payload)
            resp.raise_for_status()
            data = resp.json()
            choice = data.get("choices", [{}])[0]
            msg = choice.get("message", {})
            return {
                "message": {
                    "content": msg.get("content", ""),
                    "tool_calls": msg.get("tool_calls", []),
                }
            }

    def generate(self, prompt: str, system: str = "") -> str:
        messages = [{"role": "user", "content": prompt}]
        if system:
            messages.insert(0, {"role": "system", "content": system})
        result = self.chat(messages)
        return result["message"]["content"]

    def chat_stream(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
        callback: Any | None = None,
    ) -> dict[str, Any]:
        return self.chat(messages, tools)

    def extract_json(self, text: str) -> Any | None:
        return OllamaProvider.extract_json(self, text)


def create_provider(config: Config) -> LLMProvider:
    provider = getattr(config, "LLM_PROVIDER", "ollama")
    if provider == "anthropic":
        return AnthropicProvider(config)
    if provider == "openai":
        return OpenAIProvider(config)
    return OllamaProvider(config)
