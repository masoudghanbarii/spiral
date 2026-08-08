from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

import pytest

from spiral.config import Config
from spiral.interactive import InteractiveMode
from spiral.mcp import MCPClient, MCPManager
from spiral.subagents import SubagentManager


@pytest.fixture
def config(tmp_path: Path) -> Config:
    c = Config()
    c.SPIRAL_DIR = tmp_path / "spiral"
    c.MEMORY_DIR = tmp_path / "spiral" / "memory"
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


class TestInteractiveMode:
    def test_queue_and_retrieve(self, config: Config) -> None:
        managers = MagicMock()
        managers.traces.record = MagicMock()
        im = InteractiveMode(managers)
        im._handle_input("hello agent")
        assert im.has_input is True
        msg = im.get_pending_message()
        assert msg is not None
        assert msg["role"] == "user"
        assert msg["content"] == "hello agent"

    def test_pause_resume(self, config: Config) -> None:
        managers = MagicMock()
        im = InteractiveMode(managers)
        assert im.is_paused is False
        im._handle_input("/pause")
        assert im.is_paused is True
        im._handle_input("/resume")
        assert im.is_paused is False

    def test_stop(self, config: Config) -> None:
        managers = MagicMock()
        im = InteractiveMode(managers)
        assert im.should_stop is False
        im._handle_input("/stop")
        assert im.should_stop is True

    def test_no_input(self, config: Config) -> None:
        managers = MagicMock()
        im = InteractiveMode(managers)
        assert im.has_input is False
        assert im.get_input() is None
        assert im.get_pending_message() is None

    def test_commands_logged_to_traces(self, config: Config) -> None:
        managers = MagicMock()
        managers.traces.record = MagicMock()
        im = InteractiveMode(managers)
        im._handle_input("/pause")
        managers.traces.record.assert_called()


class TestMCPClient:
    def test_name_and_transport(self) -> None:
        client = MCPClient({"name": "test", "transport": "stdio", "command": "echo"})
        assert client.name == "test"
        assert client.transport == "stdio"

    def test_list_tools_empty_before_connect(self) -> None:
        client = MCPClient({"name": "test", "transport": "stdio"})
        assert client.list_tools() == []

    def test_call_tool_not_connected(self) -> None:
        client = MCPClient({"name": "test", "transport": "stdio"})
        result = client.call_tool("foo", {})
        assert "Error" in result


class TestMCPManager:
    def test_no_servers(self, config: Config) -> None:
        import os

        with __import__("unittest.mock").mock.patch.dict(
            os.environ, {"SPIRAL_MCP_SERVERS": "[]"}
        ):
            mgr = MCPManager(config)
        assert len(mgr.clients) == 0

    def test_get_all_tools_empty(self, config: Config) -> None:
        import os

        with __import__("unittest.mock").mock.patch.dict(
            os.environ, {"SPIRAL_MCP_SERVERS": "[]"}
        ):
            mgr = MCPManager(config)
        assert mgr.get_all_tools() == []

    def test_call_tool_not_found(self, config: Config) -> None:
        import os

        with __import__("unittest.mock").mock.patch.dict(
            os.environ, {"SPIRAL_MCP_SERVERS": "[]"}
        ):
            mgr = MCPManager(config)
        result = mgr.call_tool("mcp_test_foo", {})
        assert "not found" in result


class TestSubagentManager:
    def test_results_empty_initially(self, config: Config) -> None:
        managers = MagicMock()
        llm = MagicMock()
        sm = SubagentManager(config, managers, llm, max_concurrent=1)
        assert sm.get_results() == {}

    def test_max_concurrent(self, config: Config) -> None:
        managers = MagicMock()
        llm = MagicMock()
        sm = SubagentManager(config, managers, llm, max_concurrent=3)
        assert sm.max_concurrent == 3
