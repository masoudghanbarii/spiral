from __future__ import annotations

import json
import os
import shutil

from spiral.config import Config
from spiral.models import HarnessState


class StateManager:
    def __init__(self, config: Config):
        self.state_file = config.STATE_FILE

    def load(self) -> HarnessState | None:
        if not self.state_file.exists():
            return None
        data = json.loads(self.state_file.read_text())
        return HarnessState.from_dict(data)

    def save(self, state: HarnessState) -> None:
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.state_file.with_suffix(".json.tmp")
        bak = self.state_file.with_suffix(".json.bak")
        tmp.write_text(json.dumps(state.to_dict(), indent=2))
        if self.state_file.exists():
            shutil.copy2(self.state_file, bak)
        os.replace(tmp, self.state_file)

    def reset(self) -> None:
        if self.state_file.exists():
            self.state_file.unlink()
        bak = self.state_file.with_suffix(".json.bak")
        if bak.exists():
            bak.unlink()
