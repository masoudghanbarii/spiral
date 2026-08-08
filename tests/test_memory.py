from __future__ import annotations

from pathlib import Path

import pytest

from spiral.config import Config
from spiral.managers.memory import (
    MemoryManager,
    ProjectMemory,
    SessionMemory,
)


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


class TestProjectMemory:
    def test_facts_roundtrip(self, config: Config) -> None:
        pm = ProjectMemory(config.MEMORY_DIR)
        assert pm.get_facts() == {}
        pm.add_fact("framework", "FastAPI")
        assert pm.get_facts()["framework"] == "FastAPI"

    def test_failures_roundtrip(self, config: Config) -> None:
        pm = ProjectMemory(config.MEMORY_DIR)
        assert pm.get_failures() == []
        pm.add_failure({"feature": "auth", "error": "timeout"})
        failures = pm.get_failures()
        assert len(failures) == 1
        assert failures[0]["feature"] == "auth"

    def test_preferences_roundtrip(self, config: Config) -> None:
        pm = ProjectMemory(config.MEMORY_DIR)
        assert pm.get_preferences() == {}
        pm.set_preference("max_retries", 5)
        assert pm.get_preferences()["max_retries"] == 5

    def test_context_for_prompt(self, config: Config) -> None:
        pm = ProjectMemory(config.MEMORY_DIR)
        pm.add_fact("lang", "Python")
        pm.add_failure({"feature": "x", "error": "y"})
        ctx = pm.get_context_for_prompt()
        assert "Python" in ctx
        assert "Known failure" in ctx

    def test_context_empty(self, config: Config) -> None:
        pm = ProjectMemory(config.MEMORY_DIR)
        assert pm.get_context_for_prompt() == ""

    def test_size_bytes(self, config: Config) -> None:
        pm = ProjectMemory(config.MEMORY_DIR)
        pm.add_fact("a", "b")
        assert pm.size_bytes() > 0


class TestSessionMemory:
    def test_auto_session_id(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR)
        assert sm.session_id
        assert len(sm.session_id) > 10

    def test_custom_session_id(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "my-session")
        assert sm.session_id == "my-session"

    def test_messages_roundtrip(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "test1")
        msgs = [{"role": "user", "content": "hello"}]
        sm.save_messages(msgs)
        loaded = sm.get_messages()
        assert loaded == msgs

    def test_messages_truncates_tool_content(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "test2")
        long_content = "x" * 2000
        msgs = [{"role": "tool", "content": long_content}]
        sm.save_messages(msgs)
        loaded = sm.get_messages()
        assert len(loaded[0]["content"]) == 500

    def test_state_roundtrip(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "test3")
        sm.save_state({"features": ["f1"], "completed": []})
        state = sm.get_state()
        assert state is not None
        assert state["features"] == ["f1"]

    def test_context_roundtrip(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "test4")
        sm.save_context({"mode": "run", "model": "test"})
        ctx = sm.get_context()
        assert ctx["mode"] == "run"

    def test_summary_roundtrip(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "test5")
        assert sm.get_summary() == ""
        sm.update_summary("agent worked on auth")
        assert sm.get_summary() == "agent worked on auth"

    def test_exists(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "test6")
        assert sm.exists() is False
        sm.save_messages([])
        assert sm.exists() is True


class TestFeatureMemory:
    def test_agent_messages_roundtrip(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "test_feat")
        fm = sm.get_feature_memory("auth-service")
        msgs = [{"role": "user", "content": "implement auth"}]
        fm.save_agent_messages(msgs)
        loaded = fm.get_agent_messages()
        assert loaded == msgs

    def test_verification_roundtrip(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "test_feat2")
        fm = sm.get_feature_memory("db-schema")
        fm.save_verification({"status": "pass", "score": 0.9})
        result = fm.get_verification()
        assert result is not None
        assert result["score"] == 0.9

    def test_tool_history_roundtrip(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "test_feat3")
        fm = sm.get_feature_memory("api")
        history = [{"tool": "read_file", "args": {"path": "x.py"}}]
        fm.save_tool_history(history)
        loaded = fm.get_tool_history()
        assert len(loaded) == 1
        assert loaded[0]["tool"] == "read_file"

    def test_feature_name_sanitized(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "test_safe")
        fm = sm.get_feature_memory("auth/service name")
        assert "/" not in str(fm.dir.name)
        assert " " not in str(fm.dir.name)


class TestMemoryManager:
    def test_create_session(self, config: Config) -> None:
        mm = MemoryManager(config)
        sm = mm.create_session("session-a")
        assert sm.session_id == "session-a"

    def test_list_sessions_empty(self, config: Config) -> None:
        mm = MemoryManager(config)
        assert mm.list_sessions() == []

    def test_list_sessions_after_creation(self, config: Config) -> None:
        mm = MemoryManager(config)
        sm = mm.create_session("s1")
        sm.save_context({"mode": "run", "started": "2026-01-01"})
        sm.save_state({"features": ["f1", "f2"], "completed_features": ["f1"]})
        sessions = mm.list_sessions()
        assert len(sessions) == 1
        assert sessions[0]["session_id"] == "s1"
        assert sessions[0]["completed"] == 1
        assert sessions[0]["total"] == 2

    def test_get_session(self, config: Config) -> None:
        mm = MemoryManager(config)
        mm.create_session("get-test")
        sm = mm.get_session("get-test")
        assert sm.session_id == "get-test"

    def test_delete_session(self, config: Config) -> None:
        mm = MemoryManager(config)
        sm = mm.create_session("del-test")
        sm.save_messages([])
        assert mm.delete_session("del-test") is True
        assert mm.list_sessions() == []

    def test_delete_nonexistent(self, config: Config) -> None:
        mm = MemoryManager(config)
        assert mm.delete_session("nope") is False

    def test_archive_feature(self, config: Config) -> None:
        sm = SessionMemory(config.MEMORY_DIR, "arch-test")
        fm = sm.get_feature_memory("feat-x")
        fm.save_agent_messages([])
        assert fm.exists()
        sm.archive_feature("feat-x")
        assert not fm.exists()
        assert (sm.features_dir / "_archive" / "feat-x").exists()

    def test_total_size_bytes(self, config: Config) -> None:
        mm = MemoryManager(config)
        sm = mm.create_session("size-test")
        sm.save_messages([{"role": "user", "content": "data"}])
        assert mm.total_size_bytes() > 0
