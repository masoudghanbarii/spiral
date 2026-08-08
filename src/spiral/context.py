from __future__ import annotations

from typing import Any

from spiral.config import Config
from spiral.llm import LLMClient
from spiral.models import TraceEntry, TraceEventType


class TokenCounter:
    @staticmethod
    def estimate(text: str) -> int:
        return max(1, int(len(text.split()) * 1.3))

    @staticmethod
    def estimate_messages(messages: list[dict[str, str]]) -> int:
        total = 0
        for msg in messages:
            total += TokenCounter.estimate(msg.get("content", ""))
        return total


class ContextManager:
    def __init__(self, config: Config, llm: LLMClient, traces: Any | None = None):
        self.config = config
        self.llm = llm
        self.traces = traces
        self.window = config.CONTEXT_WINDOW_TOKENS
        self.threshold = config.COMPACTION_THRESHOLD
        self.keep_recent = config.COMPACTION_KEEP_RECENT

    def get_token_count(self, messages: list[dict[str, str]]) -> int:
        return TokenCounter.estimate_messages(messages)

    def needs_compaction(self, messages: list[dict[str, str]]) -> bool:
        return self.get_token_count(messages) > self.window * self.threshold

    def compact(self, messages: list[dict[str, str]]) -> list[dict[str, str]]:
        if len(messages) <= self.keep_recent + 1:
            return messages
        system_msg = messages[0] if messages[0].get("role") == "system" else None
        start = 1 if system_msg else 0
        to_summarize = messages[start : -self.keep_recent]
        recent = messages[-self.keep_recent :]
        if not to_summarize:
            return messages
        summary = self._summarize(to_summarize)
        compacted: list[dict[str, str]] = []
        if system_msg:
            compacted.append(system_msg)
        compacted.append(
            {
                "role": "system",
                "content": f"[Context summary of {len(to_summarize)} earlier messages]\n{summary}",
            }
        )
        compacted.extend(recent)
        if self.traces:
            self.traces.record(
                TraceEntry(
                    event_type=TraceEventType.AGENT_STEP,
                    loop_name="context",
                    feature="*",
                    data={
                        "action": "compaction",
                        "summarized": len(to_summarize),
                        "before_tokens": TokenCounter.estimate_messages(messages),
                        "after_tokens": TokenCounter.estimate_messages(compacted),
                    },
                )
            )
        return compacted

    def _summarize(self, messages: list[dict[str, str]]) -> str:
        lines = []
        for msg in messages:
            role = msg.get("role", "?")
            content = msg.get("content", "")[:500]
            lines.append(f"[{role}] {content}")
        joined = "\n".join(lines)[:4000]
        prompt = f"""Summarize the following conversation context concisely. Preserve key decisions, tool results, and progress made.

{joined}

Return a concise summary (max 500 words):"""
        try:
            return self.llm.generate(
                prompt,
                system="You summarize agent conversation context concisely.",
            )
        except (OSError, RuntimeError, ValueError):
            return joined[:1000]

    def ensure_fits(self, messages: list[dict[str, str]]) -> list[dict[str, str]]:
        if self.needs_compaction(messages):
            return self.compact(messages)
        return messages
