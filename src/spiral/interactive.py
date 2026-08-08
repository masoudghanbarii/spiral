from __future__ import annotations

import threading
from typing import Any

from spiral.models import TraceEntry, TraceEventType


class InteractiveMode:
    def __init__(self, managers: Any):
        self.managers = managers
        self._queue: list[str] = []
        self._running = False
        self._paused = False
        self._stop = False
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        self._running = True
        self._thread = threading.Thread(target=self._read_loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._running = False
        self._thread = None

    def _read_loop(self) -> None:
        import sys

        while self._running:
            try:
                line = sys.stdin.readline()
                if not line:
                    break
                self._handle_input(line.strip())
            except (OSError, EOFError):
                break

    def _handle_input(self, line: str) -> None:
        if line.startswith("/"):
            self._handle_command(line)
        else:
            self._queue.append(line)
            self.managers.traces.record(
                TraceEntry(
                    event_type=TraceEventType.AGENT_STEP,
                    loop_name="interactive",
                    feature="*",
                    data={"action": "user_input", "content": line[:200]},
                )
            )

    def _handle_command(self, cmd: str) -> None:
        parts = cmd.split(maxsplit=1)
        command = parts[0]
        if command == "/pause":
            self._paused = True
        elif command == "/resume":
            self._paused = False
        elif command == "/stop":
            self._stop = True
        self.managers.traces.record(
            TraceEntry(
                event_type=TraceEventType.AGENT_STEP,
                loop_name="interactive",
                feature="*",
                data={"action": "command", "command": command},
            )
        )

    @property
    def has_input(self) -> bool:
        return len(self._queue) > 0

    def get_input(self) -> str | None:
        if self._queue:
            return self._queue.pop(0)
        return None

    @property
    def is_paused(self) -> bool:
        return self._paused

    @property
    def should_stop(self) -> bool:
        return self._stop

    def get_pending_message(self) -> dict[str, str] | None:
        text = self.get_input()
        if text is None:
            return None
        return {"role": "user", "content": text}
