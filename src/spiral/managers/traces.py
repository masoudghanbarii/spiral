from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

from spiral.config import Config
from spiral.models import TraceEntry, TraceEventType


class TraceManager:
    def __init__(self, config: Config):
        self.traces_dir = config.TRACES_DIR
        self.traces_dir.mkdir(parents=True, exist_ok=True)
        self._session_id = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        self._buffer: list[TraceEntry] = []

    @property
    def session_file(self) -> Path:
        return self.traces_dir / f"session_{self._session_id}.jsonl"

    def record(self, entry: TraceEntry) -> None:
        self._buffer.append(entry)
        with self.session_file.open("a") as f:
            f.write(json.dumps(entry.to_dict()) + "\n")

    def get_session_traces(self) -> list[TraceEntry]:
        return self._buffer

    def get_traces_by_feature(self, feature: str) -> list[TraceEntry]:
        return [t for t in self._buffer if t.feature == feature]

    def get_traces_by_type(self, event_type: TraceEventType) -> list[TraceEntry]:
        return [t for t in self._buffer if t.event_type == event_type]

    def get_all_sessions(self) -> list[Path]:
        return sorted(self.traces_dir.glob("session_*.jsonl"))

    def load_session(self, path: Path) -> list[TraceEntry]:
        entries = []
        with path.open() as f:
            for line in f:
                if line.strip():
                    entries.append(TraceEntry.from_dict(json.loads(line)))
        return entries

    def get_engine_feed(self) -> str:
        recent = self._buffer[-50:] if len(self._buffer) > 50 else self._buffer
        lines = []
        for t in recent:
            lines.append(
                f"[{t.event_type.value}] {t.loop_name}:{t.feature} -> {json.dumps(t.data)[:200]}"
            )
        return "\n".join(lines)
