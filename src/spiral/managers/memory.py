from __future__ import annotations

import json
import os
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from spiral.config import Config


def _atomic_write(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2))
    os.replace(tmp, path)


def _atomic_read(path: Path) -> Any | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return None


class ProjectMemory:
    def __init__(self, memory_dir: Path):
        self.dir = memory_dir / "project"
        self.facts_file = self.dir / "facts.json"
        self.failures_file = self.dir / "failures.json"
        self.preferences_file = self.dir / "preferences.json"

    def get_facts(self) -> dict[str, Any]:
        return _atomic_read(self.facts_file) or {}

    def add_fact(self, key: str, value: Any) -> None:
        facts = self.get_facts()
        facts[key] = value
        _atomic_write(self.facts_file, facts)

    def get_failures(self) -> list[dict[str, Any]]:
        return _atomic_read(self.failures_file) or []

    def add_failure(self, failure: dict[str, Any]) -> None:
        failures = self.get_failures()
        failures.append(failure)
        _atomic_write(self.failures_file, failures)

    def get_preferences(self) -> dict[str, Any]:
        return _atomic_read(self.preferences_file) or {}

    def set_preference(self, key: str, value: Any) -> None:
        prefs = self.get_preferences()
        prefs[key] = value
        _atomic_write(self.preferences_file, prefs)

    def get_context_for_prompt(self) -> str:
        facts = self.get_facts()
        failures = self.get_failures()
        prefs = self.get_preferences()
        parts: list[str] = []
        if facts:
            parts.append("Learned facts:\n" + json.dumps(facts, indent=2)[:1000])
        if failures:
            recent = failures[-5:]
            parts.append(
                "Known failure patterns:\n" + json.dumps(recent, indent=2)[:1000]
            )
        if prefs:
            parts.append("Agent preferences:\n" + json.dumps(prefs, indent=2)[:500])
        return "\n\n".join(parts)

    def size_bytes(self) -> int:
        total = 0
        for f in (self.facts_file, self.failures_file, self.preferences_file):
            if f.exists():
                total += f.stat().st_size
        return total


class SessionMemory:
    def __init__(self, memory_dir: Path, session_id: str | None = None):
        self.memory_dir = memory_dir
        if session_id:
            self.session_id = session_id
        else:
            self.session_id = (
                datetime.now(UTC).strftime("%Y%m%d_%H%M%S_") + uuid.uuid4().hex[:6]
            )
        self.dir = memory_dir / "sessions" / self.session_id
        self.messages_file = self.dir / "messages.json"
        self.state_file = self.dir / "state.json"
        self.context_file = self.dir / "context.json"
        self.summary_file = self.dir / "summary.json"
        self.features_dir = self.dir / "features"

    def exists(self) -> bool:
        return self.dir.exists()

    def save_messages(self, messages: list[dict[str, str]]) -> None:
        compacted = [
            {
                "role": m["role"],
                "content": m.get("content", "")[:500]
                if m["role"] == "tool"
                else m.get("content", ""),
            }
            for m in messages
        ]
        _atomic_write(self.messages_file, compacted)

    def get_messages(self) -> list[dict[str, str]]:
        return _atomic_read(self.messages_file) or []

    def save_state(self, state: dict[str, Any]) -> None:
        _atomic_write(self.state_file, state)

    def get_state(self) -> dict[str, Any] | None:
        return _atomic_read(self.state_file)

    def save_context(self, context: dict[str, Any]) -> None:
        _atomic_write(self.context_file, context)

    def get_context(self) -> dict[str, Any]:
        return _atomic_read(self.context_file) or {}

    def get_summary(self) -> str:
        data = _atomic_read(self.summary_file)
        if data and isinstance(data, dict):
            return data.get("summary", "")
        return ""

    def update_summary(self, text: str) -> None:
        _atomic_write(
            self.summary_file,
            {"summary": text, "updated": datetime.now(UTC).isoformat()},
        )

    def get_feature_memory(self, feature_name: str) -> FeatureMemory:
        return FeatureMemory(self.features_dir, feature_name)

    def archive_feature(self, feature_name: str) -> None:
        feat_dir = self.features_dir / feature_name
        archive_dir = self.features_dir / "_archive"
        if feat_dir.exists():
            archive_dir.mkdir(parents=True, exist_ok=True)
            target = archive_dir / feature_name
            if target.exists():
                target = archive_dir / f"{feature_name}_{uuid.uuid4().hex[:4]}"
            feat_dir.rename(target)

    def list_features(self) -> list[str]:
        if not self.features_dir.exists():
            return []
        return [
            d.name
            for d in self.features_dir.iterdir()
            if d.is_dir() and d.name != "_archive"
        ]

    def size_bytes(self) -> int:
        total = 0
        for f in self.dir.rglob("*"):
            if f.is_file():
                total += f.stat().st_size
        return total


class FeatureMemory:
    def __init__(self, features_dir: Path, feature_name: str):
        safe_name = feature_name.replace("/", "_").replace(" ", "_")
        self.dir = features_dir / safe_name
        self.agent_messages_file = self.dir / "agent_messages.json"
        self.verification_file = self.dir / "verification.json"
        self.tool_history_file = self.dir / "tool_history.json"

    def save_agent_messages(self, messages: list[dict[str, str]]) -> None:
        _atomic_write(self.agent_messages_file, messages)

    def get_agent_messages(self) -> list[dict[str, str]]:
        return _atomic_read(self.agent_messages_file) or []

    def save_verification(self, result: dict[str, Any]) -> None:
        _atomic_write(self.verification_file, result)

    def get_verification(self) -> dict[str, Any] | None:
        return _atomic_read(self.verification_file)

    def save_tool_history(self, history: list[dict[str, Any]]) -> None:
        _atomic_write(self.tool_history_file, history)

    def get_tool_history(self) -> list[dict[str, Any]]:
        return _atomic_read(self.tool_history_file) or []

    def exists(self) -> bool:
        return self.dir.exists()


class MemoryManager:
    def __init__(self, config: Config):
        self.config = config
        self.memory_dir = config.MEMORY_DIR
        self.project = ProjectMemory(self.memory_dir)

    def create_session(self, session_id: str | None = None) -> SessionMemory:
        return SessionMemory(self.memory_dir, session_id)

    def list_sessions(self) -> list[dict[str, Any]]:
        sessions_dir = self.memory_dir / "sessions"
        if not sessions_dir.exists():
            return []
        sessions: list[dict[str, Any]] = []
        for d in sorted(sessions_dir.iterdir()):
            if not d.is_dir():
                continue
            sm = SessionMemory(self.memory_dir, d.name)
            ctx = sm.get_context()
            state = sm.get_state()
            sessions.append(
                {
                    "session_id": d.name,
                    "mode": ctx.get("mode", "unknown"),
                    "started": ctx.get("started", ""),
                    "completed": len(state.get("completed_features", []))
                    if state
                    else 0,
                    "failed": len(state.get("failed_features", [])) if state else 0,
                    "total": len(state.get("features", [])) if state else 0,
                    "size_bytes": sm.size_bytes(),
                }
            )
        return sessions

    def get_session(self, session_id: str) -> SessionMemory:
        return SessionMemory(self.memory_dir, session_id)

    def delete_session(self, session_id: str) -> bool:
        session_dir = self.memory_dir / "sessions" / session_id
        if session_dir.exists():
            import shutil

            shutil.rmtree(session_dir)
            return True
        return False

    def total_size_bytes(self) -> int:
        total = 0
        if self.memory_dir.exists():
            for f in self.memory_dir.rglob("*"):
                if f.is_file():
                    total += f.stat().st_size
        return total
