from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from spiral.config import Config
from spiral.context import ContextManager, TokenCounter
from spiral.llm import LLMClient


@pytest.fixture
def config(tmp_path: Path) -> Config:
    c = Config()
    c.SPIRAL_DIR = tmp_path / "spiral"
    c.TRACES_DIR = tmp_path / "spiral" / "traces"
    c.STATE_FILE = tmp_path / "spiral" / "state.json"
    c.STATUS_FILE = tmp_path / "spiral" / "status.json"
    c.SKILLS_DIR = tmp_path / "spiral" / "skills"
    c.PROJECT_DIR = tmp_path / "project"
    c.PROJECT_DIR.mkdir(parents=True, exist_ok=True)
    c.ADR_PATH = c.PROJECT_DIR / "docs" / "adr" / "001-architecture.md"
    c.ADR_PATH.parent.mkdir(parents=True, exist_ok=True)
    c.AGENTS_PATH = c.PROJECT_DIR / "AGENTS.md"
    return c


class TestTokenCounter:
    def test_estimate_nonempty(self) -> None:
        tokens = TokenCounter.estimate("hello world foo bar")
        assert tokens > 0

    def test_estimate_empty(self) -> None:
        tokens = TokenCounter.estimate("")
        assert tokens >= 1

    def test_estimate_messages(self) -> None:
        messages = [
            {"role": "user", "content": "hello world"},
            {"role": "assistant", "content": "hi there"},
        ]
        tokens = TokenCounter.estimate_messages(messages)
        assert tokens > 0

    def test_estimate_grows_with_text(self) -> None:
        short = TokenCounter.estimate("one two three")
        long = TokenCounter.estimate(" ".join(["word"] * 100))
        assert long > short


class TestContextManager:
    def test_needs_compaction_false(self, config: Config) -> None:
        llm = LLMClient(config)
        cm = ContextManager(config, llm)
        config.CONTEXT_WINDOW_TOKENS = 10000
        config.COMPACTION_THRESHOLD = 0.8
        cm.window = 10000
        cm.threshold = 0.8
        messages = [{"role": "user", "content": "short message"}]
        assert cm.needs_compaction(messages) is False

    def test_needs_compaction_true(self, config: Config) -> None:
        llm = LLMClient(config)
        config.CONTEXT_WINDOW_TOKENS = 10
        config.COMPACTION_THRESHOLD = 0.5
        cm = ContextManager(config, llm)
        cm.window = 10
        cm.threshold = 0.5
        messages = [
            {"role": "user", "content": " ".join(["word"] * 50)},
        ]
        assert cm.needs_compaction(messages) is True

    def test_compact_reduces_messages(self, config: Config) -> None:
        llm = LLMClient(config)
        config.CONTEXT_WINDOW_TOKENS = 100
        config.COMPACTION_KEEP_RECENT = 2
        cm = ContextManager(config, llm)
        cm.keep_recent = 2
        messages = [
            {"role": "system", "content": "system prompt"},
            *[
                {"role": "user", "content": f"message {i} " + " ".join(["x"] * 20)}
                for i in range(10)
            ],
        ]
        with patch.object(llm, "generate", return_value="summary of messages"):
            result = cm.compact(messages)
        assert len(result) < len(messages)
        assert result[0]["role"] == "system"
        assert result[0]["content"] == "system prompt"

    def test_compact_keeps_recent(self, config: Config) -> None:
        llm = LLMClient(config)
        config.COMPACTION_KEEP_RECENT = 3
        cm = ContextManager(config, llm)
        cm.keep_recent = 3
        messages = [
            {"role": "system", "content": "sys"},
            *[
                {"role": "user", "content": f"msg {i} " + " ".join(["x"] * 20)}
                for i in range(10)
            ],
        ]
        with patch.object(llm, "generate", return_value="summary"):
            result = cm.compact(messages)
        recent_contents = [m["content"] for m in result[-3:]]
        assert any("msg 9" in c for c in recent_contents)
        assert any("msg 8" in c for c in recent_contents)
        assert any("msg 7" in c for c in recent_contents)

    def test_compact_short_history(self, config: Config) -> None:
        llm = LLMClient(config)
        cm = ContextManager(config, llm)
        cm.keep_recent = 4
        messages = [
            {"role": "system", "content": "sys"},
            {"role": "user", "content": "short"},
        ]
        result = cm.compact(messages)
        assert result == messages

    def test_ensure_fits_no_compaction_needed(self, config: Config) -> None:
        llm = LLMClient(config)
        cm = ContextManager(config, llm)
        cm.window = 10000
        cm.threshold = 0.8
        messages = [{"role": "user", "content": "short"}]
        result = cm.ensure_fits(messages)
        assert result == messages

    def test_ensure_fits_triggers_compaction(self, config: Config) -> None:
        llm = LLMClient(config)
        config.CONTEXT_WINDOW_TOKENS = 10
        config.COMPACTION_THRESHOLD = 0.5
        config.COMPACTION_KEEP_RECENT = 2
        cm = ContextManager(config, llm)
        cm.window = 10
        cm.threshold = 0.5
        cm.keep_recent = 2
        messages = [
            {"role": "system", "content": "sys"},
            {"role": "user", "content": " ".join(["word"] * 50)},
            {"role": "assistant", "content": " ".join(["word"] * 50)},
            {"role": "user", "content": "recent"},
            {"role": "assistant", "content": "recent reply"},
        ]
        with patch.object(llm, "generate", return_value="summary"):
            result = cm.ensure_fits(messages)
        assert len(result) < len(messages)

    def test_compaction_logs_to_traces(self, config: Config) -> None:
        llm = LLMClient(config)
        traces = MagicMock()
        cm = ContextManager(config, llm, traces)
        cm.keep_recent = 2
        messages = [
            {"role": "system", "content": "sys"},
            *[{"role": "user", "content": " ".join(["x"] * 20)} for _ in range(10)],
        ]
        with patch.object(llm, "generate", return_value="summary"):
            cm.compact(messages)
        assert traces.record.called
        call_args = traces.record.call_args[0][0]
        assert call_args.data.get("action") == "compaction"


class TestStreaming:
    def test_chat_stream_accumulates_content(self, config: Config) -> None:
        llm = LLMClient(config)
        chunks = [
            '{"message": {"content": "Hello"}, "done": false}',
            '{"message": {"content": " world"}, "done": false}',
            '{"message": {"content": ""}, "done": true}',
        ]

        mock_response = MagicMock()
        mock_response.iter_lines = MagicMock(return_value=iter(chunks))
        mock_response.raise_for_status = MagicMock()

        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.stream = MagicMock(return_value=mock_response)
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)

        with patch("httpx.Client", return_value=mock_client):
            result = llm.chat_stream([{"role": "user", "content": "hi"}])
        assert result["message"]["content"] == "Hello world"

    def test_chat_stream_callback(self, config: Config) -> None:
        llm = LLMClient(config)
        chunks = [
            '{"message": {"content": "Hi"}, "done": false}',
            '{"message": {"content": " there"}, "done": true}',
        ]
        received: list[str] = []

        def callback(token: str) -> None:
            received.append(token)

        mock_response = MagicMock()
        mock_response.iter_lines = MagicMock(return_value=iter(chunks))
        mock_response.raise_for_status = MagicMock()
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)

        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.stream = MagicMock(return_value=mock_response)

        with patch("httpx.Client", return_value=mock_client):
            llm.chat_stream([{"role": "user", "content": "hi"}], callback=callback)
        assert received == ["Hi", " there"]
