from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from spiral.config import Config
from spiral.models import HarnessState, TraceEntry, TraceEventType


@dataclass
class LoopPhase:
    loop: str = "unknown"
    phase: str = "unknown"
    feature: str = ""
    since_iso: str = ""
    elapsed_s: float = 0.0
    extra: dict[str, Any] = field(default_factory=dict)


@dataclass
class LLMMetrics:
    calls: int = 0
    last_latency_s: float = 0.0
    avg_latency_s: float = 0.0
    timeouts: int = 0
    errors: int = 0


@dataclass
class ToolMetrics:
    calls: int = 0
    errors: int = 0
    top_tools: list[tuple[str, int]] = field(default_factory=list)


@dataclass
class RateMetrics:
    completed: int = 0
    failed: int = 0
    total: int = 0
    remaining: int = 0
    elapsed_s: float = 0.0
    rate_per_h: float = 0.0
    eta_s: float = 0.0
    avg_iters_per_feat: float = 0.0
    avg_retries: float = 0.0


@dataclass
class StatusSnapshot:
    timestamp: str = ""
    mode: str = "run"
    agent_mode: str = "normal"
    pid: int = 0
    phase: LoopPhase = field(default_factory=LoopPhase)
    rate: RateMetrics = field(default_factory=RateMetrics)
    llm: LLMMetrics = field(default_factory=LLMMetrics)
    tools: ToolMetrics = field(default_factory=ToolMetrics)
    recent_events: list[TraceEntry] = field(default_factory=list)
    failures: list[str] = field(default_factory=list)
    current_feature_name: str = ""
    current_feature_index: int = 0
    current_feature_attempts: int = 0
    session_started_iso: str = ""
    is_alive: bool = False
    alive_pid: int = 0
    status_file_missing: bool = False
    context_tokens: int = 0
    context_window: int = 0


class StatusMonitor:
    def __init__(self, config: Config):
        self.config = config
        self.state_file: Path = config.STATE_FILE
        self.status_file: Path = config.STATUS_FILE
        self.traces_dir: Path = config.TRACES_DIR
        self.context_window: int = config.CONTEXT_WINDOW_TOKENS

    def snapshot(self) -> StatusSnapshot:
        now = datetime.now(UTC)
        snap = StatusSnapshot(timestamp=now.isoformat())
        snap.context_window = self.context_window

        self._load_status(snap, now)
        self._load_state(snap)
        self._load_traces(snap, now)
        self._detect_alive(snap)
        return snap

    def _load_status(self, snap: StatusSnapshot, now: datetime) -> None:
        if not self.status_file.exists():
            snap.status_file_missing = True
            return
        try:
            data: dict[str, Any] = __import__("json").loads(
                self.status_file.read_text()
            )
        except (OSError, ValueError):
            snap.status_file_missing = True
            return
        snap.mode = data.get("mode", "run")
        snap.agent_mode = data.get("agent_mode", "normal")
        snap.pid = data.get("pid", 0)
        snap.alive_pid = snap.pid
        ts_str = data.get("ts", "")
        snap.phase.loop = data.get("loop", "unknown")
        snap.phase.phase = data.get("phase", "unknown")
        snap.phase.feature = data.get("feature", "")
        snap.phase.extra = {
            k: v
            for k, v in data.items()
            if k not in {"ts", "pid", "loop", "phase", "feature", "mode"}
        }
        snap.context_tokens = snap.phase.extra.get("context_tokens", 0)
        if ts_str:
            snap.phase.since_iso = ts_str
            try:
                ts_dt = datetime.fromisoformat(ts_str)
                snap.phase.elapsed_s = (now - ts_dt).total_seconds()
            except ValueError:
                pass

    def _load_state(self, snap: StatusSnapshot) -> None:
        if not self.state_file.exists():
            return
        try:
            data: dict[str, Any] = __import__("json").loads(self.state_file.read_text())
        except (OSError, ValueError):
            return
        state = HarnessState.from_dict(data)
        snap.rate.completed = len(state.completed_features)
        snap.rate.failed = len(state.failed_features)
        snap.rate.total = len(state.features)
        snap.rate.remaining = snap.rate.total - snap.rate.completed - snap.rate.failed
        snap.failures = list(state.failed_features)
        idx = state.current_feature_index
        snap.current_feature_index = idx
        if idx < len(state.features):
            feat = state.features[idx]
            snap.current_feature_name = feat.name
            snap.current_feature_attempts = feat.implementation_attempts
        if snap.phase.feature and not snap.current_feature_name:
            snap.current_feature_name = snap.phase.feature

        if (
            state.total_agent_iterations > 0
            and snap.rate.completed + snap.rate.failed > 0
        ):
            snap.rate.avg_iters_per_feat = state.total_agent_iterations / (
                snap.rate.completed + snap.rate.failed
            )
        completed_count = snap.rate.completed
        if completed_count > 0 and state.total_verification_runs > 0:
            snap.rate.avg_retries = max(
                0.0,
                (state.total_verification_runs - completed_count) / completed_count,
            )

    def _load_traces(self, snap: StatusSnapshot, now: datetime) -> None:
        traces = self._read_all_session_traces()
        if not traces:
            return
        if not snap.session_started_iso:
            snap.session_started_iso = traces[0].timestamp
        try:
            started = datetime.fromisoformat(snap.session_started_iso)
            snap.rate.elapsed_s = max(0.0, (now - started).total_seconds())
        except ValueError:
            pass
        if snap.rate.elapsed_s > 0 and snap.rate.completed > 0:
            snap.rate.rate_per_h = snap.rate.completed / (snap.rate.elapsed_s / 3600)
        if snap.rate.rate_per_h > 0 and snap.rate.remaining > 0:
            snap.rate.eta_s = snap.rate.remaining / snap.rate.rate_per_h * 3600

        snap.recent_events = traces[-15:]

        tool_counter: Counter[str] = Counter()
        tool_errors = 0
        tool_calls = 0
        llm_latencies: list[float] = []
        for i, t in enumerate(traces):
            if t.event_type == TraceEventType.TOOL_CALL:
                tool_calls += 1
                tool_name = t.data.get("tool", "?")
                tool_counter[tool_name] += 1
            if t.event_type == TraceEventType.TOOL_RESULT:
                result = t.data.get("result", "")
                if isinstance(result, str) and result.startswith("Error"):
                    tool_errors += 1
            if t.event_type == TraceEventType.ERROR:
                data = t.data
                if (
                    isinstance(data, dict)
                    and "timeout" in str(data.get("error", "")).lower()
                ):
                    snap.llm.timeouts += 1
            if t.event_type == TraceEventType.AGENT_STEP:
                action = t.data.get("action", "")
                ts_str = t.timestamp
                if action == "start":
                    for j in range(i + 1, len(traces)):
                        nxt = traces[j]
                        if nxt.event_type in (
                            TraceEventType.TOOL_CALL,
                            TraceEventType.AGENT_STEP,
                        ):
                            try:
                                d = (
                                    datetime.fromisoformat(nxt.timestamp)
                                    - datetime.fromisoformat(ts_str)
                                ).total_seconds()
                                if d > 0:
                                    llm_latencies.append(d)
                            except ValueError:
                                pass
                            break
        snap.tools.calls = tool_calls
        snap.tools.errors = tool_errors
        snap.tools.top_tools = tool_counter.most_common(5)
        snap.llm.calls = len(llm_latencies) or sum(
            1
            for t in traces
            if t.event_type == TraceEventType.AGENT_STEP
            and t.data.get("action") == "start"
        )
        if llm_latencies:
            snap.llm.last_latency_s = llm_latencies[-1]
            snap.llm.avg_latency_s = sum(llm_latencies) / len(llm_latencies)

    def _read_all_session_traces(self) -> list[TraceEntry]:
        all_entries: list[TraceEntry] = []
        files = sorted(self.traces_dir.glob("session_*.jsonl"))
        import json as _json

        for f in files:
            with f.open() as fh:
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        all_entries.append(TraceEntry.from_dict(_json.loads(line)))
                    except (ValueError, KeyError):
                        continue
        return all_entries

    def _detect_alive(self, snap: StatusSnapshot) -> None:
        if snap.pid == 0:
            snap.is_alive = False
            return
        try:
            import os as _os

            _os.kill(snap.pid, 0)
            snap.is_alive = True
        except (ProcessLookupError, PermissionError):
            snap.is_alive = False
