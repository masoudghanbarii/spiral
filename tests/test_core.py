from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest

from spiral.config import Config
from spiral.harness import Harness
from spiral.managers.state import StateManager
from spiral.models import (
    Feature,
    GradingResult,
    HarnessState,
    TraceEntry,
    TraceEventType,
    VerificationStatus,
)


@pytest.fixture
def config(tmp_path: Path) -> Config:
    c = Config()
    c.SPIRAL_DIR = tmp_path / "spiral"
    c.TRACES_DIR = tmp_path / "spiral" / "traces"
    c.STATE_FILE = tmp_path / "spiral" / "state.json"
    c.SKILLS_DIR = tmp_path / "spiral" / "skills"
    c.PROJECT_DIR = tmp_path / "project"
    c.PROJECT_DIR.mkdir(parents=True, exist_ok=True)
    c.ADR_PATH = c.PROJECT_DIR / "docs" / "adr" / "001-architecture.md"
    c.ADR_PATH.parent.mkdir(parents=True, exist_ok=True)
    c.AGENTS_PATH = c.PROJECT_DIR / "AGENTS.md"
    return c


def test_feature_roundtrip() -> None:
    f = Feature(name="test", description="desc", adr_section="sec")
    d = f.to_dict()
    f2 = Feature(**d)
    assert f2.name == "test"
    assert f2.description == "desc"
    assert f2.adr_section == "sec"


def test_harness_state_roundtrip() -> None:
    s = HarnessState()
    s.features = [Feature(name="f1"), Feature(name="f2")]
    s.completed_features = ["f1"]
    d = s.to_dict()
    s2 = HarnessState.from_dict(d)
    assert len(s2.features) == 2
    assert s2.completed_features == ["f1"]


def test_trace_entry_roundtrip() -> None:
    t = TraceEntry(
        event_type=TraceEventType.AGENT_STEP,
        loop_name="test",
        feature="f1",
        data={"key": "val"},
    )
    d = t.to_dict()
    t2 = TraceEntry.from_dict(d)
    assert t2.event_type == TraceEventType.AGENT_STEP
    assert t2.loop_name == "test"
    assert t2.feature == "f1"
    assert t2.data["key"] == "val"


def test_grading_result() -> None:
    g = GradingResult(
        status=VerificationStatus.PASS,
        score=0.95,
        feedback="good",
        rubric_breakdown={"test": True},
    )
    d = g.to_dict()
    assert d["status"] == "pass"
    assert d["score"] == 0.95


def test_state_manager_save_load(config: Config) -> None:
    sm = StateManager(config)
    s = HarnessState()
    s.features = [Feature(name="f1")]
    sm.save(s)
    loaded = sm.load()
    assert loaded is not None
    assert len(loaded.features) == 1
    assert loaded.features[0].name == "f1"


def test_state_manager_reset(config: Config) -> None:
    sm = StateManager(config)
    s = HarnessState()
    sm.save(s)
    assert config.STATE_FILE.exists()
    sm.reset()
    assert not config.STATE_FILE.exists()


def test_trace_manager_records(config: Config) -> None:
    from spiral.managers.traces import TraceManager

    tm = TraceManager(config)
    t = TraceEntry(event_type=TraceEventType.AGENT_STEP, loop_name="test", feature="f1")
    tm.record(t)
    assert len(tm.get_session_traces()) == 1
    assert tm.get_session_traces()[0].feature == "f1"


def test_trace_manager_filter_by_feature(config: Config) -> None:
    from spiral.managers.traces import TraceManager

    tm = TraceManager(config)
    tm.record(
        TraceEntry(event_type=TraceEventType.AGENT_STEP, loop_name="test", feature="f1")
    )
    tm.record(
        TraceEntry(event_type=TraceEventType.AGENT_STEP, loop_name="test", feature="f2")
    )
    assert len(tm.get_traces_by_feature("f1")) == 1
    assert len(tm.get_traces_by_feature("f2")) == 1


def test_trace_manager_filter_by_type(config: Config) -> None:
    from spiral.managers.traces import TraceManager

    tm = TraceManager(config)
    tm.record(
        TraceEntry(event_type=TraceEventType.AGENT_STEP, loop_name="test", feature="f1")
    )
    tm.record(
        TraceEntry(event_type=TraceEventType.TOOL_CALL, loop_name="test", feature="f1")
    )
    assert len(tm.get_traces_by_type(TraceEventType.AGENT_STEP)) == 1
    assert len(tm.get_traces_by_type(TraceEventType.TOOL_CALL)) == 1


def test_harness_initialization(config: Config) -> None:
    config.ADR_PATH.write_text("# Test ADR\n## Section 1\nSome content")
    config.AGENTS_PATH.write_text("# Test AGENTS.md")
    with patch("spiral.llm.LLMClient.generate") as mock_gen:
        mock_gen.return_value = (
            '[{"name": "f1", "description": "test", "adr_section": "Section 1"}]'
        )
        harness = Harness(config)
        harness.initialize()
    assert harness.state is not None
    assert len(harness.state.features) > 0
    assert harness.state.features[0].name == "f1"


def test_event_driver_feature_cycle(config: Config) -> None:
    from spiral.llm import LLMClient
    from spiral.loops.event_driver import EventDriver
    from spiral.managers import ManagerRegistry

    config.ADR_PATH.write_text("# Test ADR\n## Section 1\nSome content")
    config.AGENTS_PATH.write_text("# Test AGENTS.md")
    managers = ManagerRegistry(config)
    llm = LLMClient(config)
    ed = EventDriver(config, managers, llm)
    state = HarnessState()
    state.features = [Feature(name="f1"), Feature(name="f2")]
    assert ed.get_next_feature(state) is not None
    assert ed.get_next_feature(state).name == "f1"
    assert ed.has_more_work(state)
    ed.on_feature_complete(state, state.features[0])
    assert state.current_feature_index == 1
    assert "f1" in state.completed_features
