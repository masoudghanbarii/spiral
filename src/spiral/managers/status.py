from __future__ import annotations

import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from spiral.config import Config


class StatusManager:
    def __init__(self, config: Config):
        self.status_file: Path = config.STATUS_FILE

    def write(self, data: dict[str, Any]) -> None:
        payload = {
            "ts": datetime.now(UTC).isoformat(),
            "pid": os.getpid(),
            **data,
        }
        self.status_file.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.status_file.with_suffix(".tmp")
        tmp.write_text(json.dumps(payload, indent=2))
        os.replace(tmp, self.status_file)

    def read(self) -> dict[str, Any] | None:
        if not self.status_file.exists():
            return None
        try:
            return json.loads(self.status_file.read_text())
        except (OSError, json.JSONDecodeError):
            return None

    def clear(self) -> None:
        if self.status_file.exists():
            self.status_file.unlink()
