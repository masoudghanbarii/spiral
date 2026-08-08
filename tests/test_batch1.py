from __future__ import annotations

from pathlib import Path

import pytest

from spiral.config import Config
from spiral.managers.permissions import PermissionLevel, PermissionManager
from spiral.managers.project import ProjectManager
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
    return c


class TestEditFile:
    def test_edit_file_single_replace(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("test.py", "def foo():\n    return 1\n")
        result = pm.edit_file("test.py", "return 1", "return 2")
        assert "1 occurrence" in result
        assert "return 2" in pm.read_file("test.py")

    def test_edit_file_not_found(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("test.py", "content")
        with pytest.raises(ValueError, match="not found"):
            pm.edit_file("test.py", "nonexistent", "x")

    def test_edit_file_multiple_without_replace_all(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("test.py", "a\na\na\n")
        with pytest.raises(ValueError, match="3 times"):
            pm.edit_file("test.py", "a", "b")

    def test_edit_file_replace_all(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("test.py", "a\na\na\n")
        result = pm.edit_file("test.py", "a", "b", replace_all=True)
        assert "3 occurrence" in result
        content = pm.read_file("test.py")
        assert content == "b\nb\nb\n"

    def test_edit_file_preserves_indentation(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("test.py", "def foo():\n    x = 1\n    y = 2\n")
        pm.edit_file("test.py", "    x = 1", "    x = 3")
        content = pm.read_file("test.py")
        assert "    x = 3" in content
        assert "    y = 2" in content

    def test_edit_file_missing_file(self, config: Config) -> None:
        pm = ProjectManager(config)
        with pytest.raises(FileNotFoundError):
            pm.edit_file("nonexistent.py", "a", "b")

    def test_tool_registry_edit_file(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("t.py", "hello")
        config.AUTO_APPROVE = True
        tools = ToolRegistry(config, pm)
        tools.permissions.auto_approve = True
        result = tools.execute(
            "edit_file", {"path": "t.py", "old_string": "hello", "new_string": "world"}
        )
        assert "Replaced" in result
        assert pm.read_file("t.py") == "world"


class TestReadFileOffsetLimit:
    def test_read_file_with_offset(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("test.py", "line1\nline2\nline3\nline4\nline5\n")
        result = pm.read_file("test.py", offset=3)
        assert "3: line3" in result
        assert "line1" not in result

    def test_read_file_with_offset_and_limit(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("test.py", "line1\nline2\nline3\nline4\nline5\n")
        result = pm.read_file("test.py", offset=2, limit=2)
        assert "2: line2" in result
        assert "3: line3" in result
        assert "line1" not in result
        assert "line4" not in result

    def test_read_file_no_offset_reads_all(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("test.py", "a\nb\n")
        result = pm.read_file("test.py")
        assert "a" in result
        assert "b" in result

    def test_tool_registry_read_file_with_offset(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("t.py", "x\ny\nz\n")
        tools = ToolRegistry(config, pm)
        result = tools.execute("read_file", {"path": "t.py", "offset": 2, "limit": 1})
        assert "2: y" in result


class TestGrep:
    def test_grep_finds_matches(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("a.py", "def foo():\n    pass\n")
        pm.write_file("b.py", "def bar():\n    pass\n")
        matches = pm.grep("def (\\w+)")
        assert len(matches) >= 2
        files = {m["file"] for m in matches}
        assert "a.py" in files
        assert "b.py" in files

    def test_grep_no_matches(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("a.py", "nothing here")
        matches = pm.grep("class \\w+")
        assert matches == []

    def test_grep_with_include_filter(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("a.py", "target\n")
        pm.write_file("b.txt", "target\n")
        matches = pm.grep("target", include="*.py")
        files = {m["file"] for m in matches}
        assert "a.py" in files
        assert "b.txt" not in files

    def test_grep_returns_line_numbers(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("test.py", "line1\ntarget_line\nline3\n")
        matches = pm.grep("target")
        assert len(matches) == 1
        assert matches[0]["line"] == 2
        assert "target_line" in matches[0]["content"]

    def test_tool_registry_grep(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("a.py", "def hello():\n    pass\n")
        tools = ToolRegistry(config, pm)
        result = tools.execute("grep", {"pattern": "hello"})
        assert "hello" in result
        assert "a.py" in result


class TestGlob:
    def test_glob_finds_files(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("src/a.py", "")
        pm.write_file("src/b.py", "")
        pm.write_file("readme.md", "")
        files = pm.glob("**/*.py")
        assert "src/a.py" in files
        assert "src/b.py" in files
        assert "readme.md" not in files

    def test_glob_no_matches(self, config: Config) -> None:
        pm = ProjectManager(config)
        files = pm.glob("**/*.rs")
        assert files == []

    def test_tool_registry_glob(self, config: Config) -> None:
        pm = ProjectManager(config)
        pm.write_file("a.py", "")
        tools = ToolRegistry(config, pm)
        result = tools.execute("glob", {"pattern": "*.py"})
        assert "a.py" in result


class TestPermissions:
    def test_auto_approve_non_destructive(self, config: Config) -> None:
        pm = PermissionManager(config)
        level = pm.check("read_file", {"path": "test.py"})
        assert level == PermissionLevel.AUTO

    def test_auto_approve_enabled(self, config: Config) -> None:
        config.AUTO_APPROVE = True
        pm = PermissionManager(config)
        level = pm.check("write_file", {"path": "test.py", "content": "x"})
        assert level == PermissionLevel.AUTO

    def test_deny_rm_rf(self, config: Config) -> None:
        pm = PermissionManager(config)
        level = pm.check("run_command", {"command": "rm -rf /"})
        assert level == PermissionLevel.DENY

    def test_deny_git_push_force(self, config: Config) -> None:
        pm = PermissionManager(config)
        level = pm.check("run_command", {"command": "git push --force origin main"})
        assert level == PermissionLevel.DENY

    def test_deny_sudo(self, config: Config) -> None:
        pm = PermissionManager(config)
        level = pm.check("run_command", {"command": "sudo rm test"})
        assert level == PermissionLevel.DENY

    def test_protected_path_env(self, config: Config) -> None:
        pm = PermissionManager(config)
        level = pm.check("write_file", {"path": ".env", "content": "SECRET=x"})
        assert level == PermissionLevel.APPROVE

    def test_should_execute_allows_safe(self, config: Config) -> None:
        pm = PermissionManager(config)
        ok, _ = pm.should_execute("read_file", {"path": "test.py"})
        assert ok is True

    def test_should_execute_denies_dangerous(self, config: Config) -> None:
        pm = PermissionManager(config)
        ok, reason = pm.should_execute("run_command", {"command": "rm -rf /home"})
        assert ok is False
        assert "Denied" in reason

    def test_tool_registry_denies_dangerous_command(self, config: Config) -> None:
        pm = ProjectManager(config)
        tools = ToolRegistry(config, pm)
        result = tools.execute("run_command", {"command": "rm -rf /"})
        assert "Error" in result
        assert "deny" in result.lower() or "Denied" in result
