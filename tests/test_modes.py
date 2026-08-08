from __future__ import annotations

from pathlib import Path

import pytest

from spiral.config import Config
from spiral.managers.project import ProjectManager
from spiral.modes import (
    AgentMode,
    get_disabled_tools,
    get_system_prompt_suffix,
)
from spiral.tools.registry import ToolRegistry


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
    c.AUTO_APPROVE = True
    return c


class TestModeDefinitions:
    def test_normal_mode_no_disabled(self) -> None:
        assert get_disabled_tools(AgentMode.NORMAL) == frozenset()

    def test_plan_mode_disables_writes(self) -> None:
        disabled = get_disabled_tools(AgentMode.PLAN)
        assert "write_file" in disabled
        assert "edit_file" in disabled
        assert "run_command" in disabled
        assert "git_commit" in disabled

    def test_plan_mode_allows_reads(self) -> None:
        disabled = get_disabled_tools(AgentMode.PLAN)
        assert "read_file" not in disabled
        assert "grep" not in disabled
        assert "glob" not in disabled
        assert "read_adr" not in disabled

    def test_safe_mode_disables_more_than_plan(self) -> None:
        plan_disabled = get_disabled_tools(AgentMode.PLAN)
        safe_disabled = get_disabled_tools(AgentMode.SAFE)
        assert safe_disabled > plan_disabled
        assert "run_tests" in safe_disabled
        assert "run_lint" in safe_disabled

    def test_bypass_mode_no_disabled(self) -> None:
        assert get_disabled_tools(AgentMode.BYPASS) == frozenset()

    def test_interactive_mode_no_disabled(self) -> None:
        assert get_disabled_tools(AgentMode.INTERACTIVE) == frozenset()


class TestSystemPromptSuffix:
    def test_normal_empty(self) -> None:
        assert get_system_prompt_suffix(AgentMode.NORMAL) == ""

    def test_plan_has_instruction(self) -> None:
        suffix = get_system_prompt_suffix(AgentMode.PLAN)
        assert "PLAN MODE" in suffix
        assert "Do not write" in suffix

    def test_safe_has_instruction(self) -> None:
        suffix = get_system_prompt_suffix(AgentMode.SAFE)
        assert "SAFE MODE" in suffix
        assert "read-only" in suffix

    def test_bypass_has_note(self) -> None:
        suffix = get_system_prompt_suffix(AgentMode.BYPASS)
        assert "Bypass" in suffix

    def test_interactive_has_note(self) -> None:
        suffix = get_system_prompt_suffix(AgentMode.INTERACTIVE)
        assert "Interactive" in suffix


class TestToolRegistryModeEnforcement:
    def test_plan_mode_blocks_write_file(self, config: Config) -> None:
        pm = ProjectManager(config)
        tools = ToolRegistry(config, pm, agent_mode=AgentMode.PLAN)
        result = tools.execute("write_file", {"path": "x.py", "content": "x"})
        assert "disabled" in result
        assert "plan" in result

    def test_plan_mode_blocks_edit_file(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("t.py", "content")
        tools = ToolRegistry(config, pm, agent_mode=AgentMode.PLAN)
        result = tools.execute(
            "edit_file", {"path": "t.py", "old_string": "content", "new_string": "new"}
        )
        assert "disabled" in result

    def test_plan_mode_blocks_run_command(self, config: Config) -> None:
        pm = ProjectManager(config)
        tools = ToolRegistry(config, pm, agent_mode=AgentMode.PLAN)
        result = tools.execute("run_command", {"command": "echo hi"})
        assert "disabled" in result

    def test_plan_mode_allows_read_file(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("t.py", "content")
        tools = ToolRegistry(config, pm, agent_mode=AgentMode.PLAN)
        result = tools.execute("read_file", {"path": "t.py"})
        assert "content" in result

    def test_plan_mode_allows_grep(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("t.py", "def foo(): pass")
        tools = ToolRegistry(config, pm, agent_mode=AgentMode.PLAN)
        result = tools.execute("grep", {"pattern": "foo"})
        assert "foo" in result

    def test_safe_mode_blocks_run_tests(self, config: Config) -> None:
        pm = ProjectManager(config)
        tools = ToolRegistry(config, pm, agent_mode=AgentMode.SAFE)
        result = tools.execute("run_tests", {})
        assert "disabled" in result
        assert "safe" in result

    def test_safe_mode_blocks_write(self, config: Config) -> None:
        pm = ProjectManager(config)
        tools = ToolRegistry(config, pm, agent_mode=AgentMode.SAFE)
        result = tools.execute("write_file", {"path": "x.py", "content": "x"})
        assert "disabled" in result

    def test_safe_mode_allows_read(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("t.py", "data")
        tools = ToolRegistry(config, pm, agent_mode=AgentMode.SAFE)
        result = tools.execute("read_file", {"path": "t.py"})
        assert "data" in result

    def test_bypass_mode_skips_permissions(self, config: Config) -> None:
        pm = ProjectManager(config)
        config.AUTO_APPROVE = False
        tools = ToolRegistry(config, pm, agent_mode=AgentMode.BYPASS)
        result = tools.execute("run_command", {"command": "rm -rf /"})
        assert "disabled" not in result
        assert True

    def test_normal_mode_allows_with_auto_approve(self, config: Config) -> None:
        pm = ProjectManager(config)
        config.AUTO_APPROVE = True
        tools = ToolRegistry(config, pm, agent_mode=AgentMode.NORMAL)
        tools.permissions.auto_approve = True
        pm.write_file("t.py", "old")
        result = tools.execute(
            "edit_file", {"path": "t.py", "old_string": "old", "new_string": "new"}
        )
        assert "Replaced" in result
