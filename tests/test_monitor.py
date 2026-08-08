from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from spiral.config import Config
from spiral.managers.status import StatusManager
from spiral.models import Feature, HarnessState, TraceEntry, TraceEventType
from spiral.monitor import StatusMonitor


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


class TestStatusManager:
    def test_write_then_read(self, config: Config) -> None:
        sm = StatusManager(config)
        sm.write({"loop": "agent", "phase": "llm_wait", "feature": "f1"})
        data = sm.read()
        assert data is not None
        assert data["loop"] == "agent"
        assert data["phase"] == "llm_wait"
        assert data["feature"] == "f1"
        assert "ts" in data
        assert "pid" in data

    def test_read_missing_file(self, config: Config) -> None:
        sm = StatusManager(config)
        assert sm.read() is None

    def test_clear(self, config: Config) -> None:
        sm = StatusManager(config)
        sm.write({"loop": "agent", "phase": "start"})
        assert config.STATUS_FILE.exists()
        sm.clear()
        assert not config.STATUS_FILE.exists()


class TestStatusMonitorSnapshot:
    def test_snapshot_empty(self, config: Config) -> None:
        mon = StatusMonitor(config)
        snap = mon.snapshot()
        assert snap.status_file_missing is True
        assert snap.rate.total == 0
        assert snap.is_alive is False

    def test_snapshot_with_state_and_status(self, config: Config) -> None:
        sm = StatusManager(config)
        sm.write(
            {"loop": "agent", "phase": "llm_wait", "feature": "auth", "mode": "run"}
        )
        state = HarnessState()
        state.features = [Feature(name="auth"), Feature(name="db")]
        state.completed_features = ["auth"]
        config.STATE_FILE.write_text(json.dumps(state.to_dict(), indent=2))

        mon = StatusMonitor(config)
        snap = mon.snapshot()
        assert snap.rate.total == 2
        assert snap.rate.completed == 1
        assert snap.rate.remaining == 1
        assert snap.phase.loop == "agent"
        assert snap.phase.phase == "llm_wait"
        assert snap.mode == "run"
        assert snap.current_feature_name in {"auth", "db"}

    def test_snapshot_rate_and_eta(self, config: Config) -> None:
        sm = StatusManager(config)
        sm.write({"loop": "event", "phase": "idle", "mode": "run"})
        state = HarnessState()
        state.features = [Feature(name=f"f{i}") for i in range(10)]
        state.completed_features = [f"f{i}" for i in range(4)]
        config.STATE_FILE.write_text(json.dumps(state.to_dict(), indent=2))

        now = datetime.now(UTC)
        start_ts = (now - timedelta(hours=2)).isoformat()
        config.TRACES_DIR.mkdir(parents=True, exist_ok=True)
        first = TraceEntry(
            event_type=TraceEventType.AGENT_STEP,
            loop_name="agent",
            feature="f0",
            timestamp=start_ts,
        )
        config.TRACES_DIR.joinpath("session_x.jsonl").write_text(
            json.dumps(first.to_dict()) + "\n"
        )

        mon = StatusMonitor(config)
        snap = mon.snapshot()
        assert snap.rate.elapsed_s > 7000
        assert snap.rate.rate_per_h > 0
        assert snap.rate.eta_s > 0

    def test_snapshot_tool_metrics(self, config: Config) -> None:
        config.TRACES_DIR.mkdir(parents=True, exist_ok=True)
        entries = [
            TraceEntry(
                event_type=TraceEventType.TOOL_CALL,
                loop_name="agent",
                feature="f1",
                data={"tool": "write_file"},
            ),
            TraceEntry(
                event_type=TraceEventType.TOOL_CALL,
                loop_name="agent",
                feature="f1",
                data={"tool": "read_file"},
            ),
            TraceEntry(
                event_type=TraceEventType.TOOL_CALL,
                loop_name="agent",
                feature="f1",
                data={"tool": "write_file"},
            ),
            TraceEntry(
                event_type=TraceEventType.TOOL_RESULT,
                loop_name="agent",
                feature="f1",
                data={"tool": "write_file", "result": "Error executing: boom"},
            ),
        ]
        lines = "\n".join(json.dumps(e.to_dict()) for e in entries) + "\n"
        config.TRACES_DIR.joinpath("session_t.jsonl").write_text(lines)

        mon = StatusMonitor(config)
        snap = mon.snapshot()
        assert snap.tools.calls == 3
        assert snap.tools.errors == 1
        top = dict(snap.tools.top_tools)
        assert top.get("write_file") == 2

    def test_snapshot_failures(self, config: Config) -> None:
        sm = StatusManager(config)
        sm.write({"loop": "harness", "phase": "idle", "mode": "run"})
        state = HarnessState()
        state.features = [
            Feature(name="ok"),
            Feature(name="bad1"),
            Feature(name="bad2"),
        ]
        state.completed_features = ["ok"]
        state.failed_features = ["bad1", "bad2"]
        config.STATE_FILE.write_text(json.dumps(state.to_dict(), indent=2))

        mon = StatusMonitor(config)
        snap = mon.snapshot()
        assert "bad1" in snap.failures
        assert "bad2" in snap.failures

    def test_snapshot_recent_events(self, config: Config) -> None:
        config.TRACES_DIR.mkdir(parents=True, exist_ok=True)
        entries = [
            TraceEntry(
                event_type=TraceEventType.AGENT_STEP,
                loop_name="agent",
                feature=f"f{i}",
            )
            for i in range(20)
        ]
        lines = "\n".join(json.dumps(e.to_dict()) for e in entries) + "\n"
        config.TRACES_DIR.joinpath("session_r.jsonl").write_text(lines)

        mon = StatusMonitor(config)
        snap = mon.snapshot()
        assert len(snap.recent_events) == 15
        assert snap.recent_events[-1].feature == "f19"

    def test_snapshot_alive_detection_dead_pid(self, config: Config) -> None:
        sm = StatusManager(config)
        sm.write({"loop": "agent", "phase": "llm_wait", "mode": "run", "pid": 999999})
        mon = StatusMonitor(config)
        snap = mon.snapshot()
        assert snap.is_alive is False

    def test_snapshot_alive_detection_self(self, config: Config) -> None:
        import os

        sm = StatusManager(config)
        sm.write(
            {"loop": "agent", "phase": "llm_wait", "mode": "run", "pid": os.getpid()}
        )
        mon = StatusMonitor(config)
        snap = mon.snapshot()
        assert snap.is_alive is True


class TestWatchRendering:
    def test_render_snapshot_empty_does_not_raise(self, config: Config) -> None:
        from spiral.watch import render_snapshot

        mon = StatusMonitor(config)
        snap = mon.snapshot()
        panel = render_snapshot(snap)
        assert panel is not None

    def test_render_snapshot_with_data(self, config: Config) -> None:
        from spiral.watch import render_snapshot

        sm = StatusManager(config)
        sm.write(
            {"loop": "agent", "phase": "llm_wait", "feature": "auth", "mode": "run"}
        )
        state = HarnessState()
        state.features = [Feature(name="auth"), Feature(name="db")]
        state.completed_features = ["auth"]
        config.STATE_FILE.write_text(json.dumps(state.to_dict(), indent=2))

        mon = StatusMonitor(config)
        snap = mon.snapshot()
        panel = render_snapshot(snap)
        assert panel is not None
