from __future__ import annotations

import argparse

from spiral.config import Config
from spiral.harness import Harness


def main() -> None:
    parser = argparse.ArgumentParser(description="Spiral AI Co-founder")
    parser.add_argument(
        "--mode",
        choices=["run", "forever", "init", "reset", "watch", "sessions"],
        default="run",
    )
    parser.add_argument("--project-dir", default=str(Config.PROJECT_DIR))
    parser.add_argument(
        "--behavior",
        choices=["normal", "plan", "bypass", "interactive", "safe"],
        default=None,
        help="Agent behavior mode (overrides SPIRAL_AGENT_MODE env var)",
    )
    parser.add_argument(
        "--session-id",
        default=None,
        help="Specify session ID for multi-session support",
    )
    args = parser.parse_args()

    config = Config()
    if args.behavior:
        config.AGENT_MODE = args.behavior
    if args.project_dir:
        config.PROJECT_DIR = type(config.PROJECT_DIR)(args.project_dir)
        config.ADR_PATH = config.PROJECT_DIR / "docs" / "adr" / "001-architecture.md"
        config.AGENTS_PATH = config.PROJECT_DIR / "AGENTS.md"

    if args.mode == "watch":
        from spiral.watch import watch

        watch(config)
        return

    if args.mode == "sessions":
        from spiral.managers.memory import MemoryManager

        mm = MemoryManager(config)
        sessions = mm.list_sessions()
        if not sessions:
            print("[spiral] No sessions found")
            return
        print(
            f"{'Session ID':<30} {'Mode':<10} {'Done':<6} {'Fail':<6} {'Total':<6} {'Size'}"
        )
        print("-" * 75)
        for s in sessions:
            print(
                f"{s['session_id']:<30} {s['mode']:<10} "
                f"{s['completed']:<6} {s['failed']:<6} "
                f"{s['total']:<6} {s['size_bytes']}B"
            )
        return

    harness = Harness(config)
    if args.session_id:
        harness.session = harness.managers.memory.create_session(args.session_id)

    if args.mode == "reset":
        from spiral.managers.state import StateManager

        sm = StateManager(config)
        sm.reset()
        print("[spiral] State reset")
        return

    if args.mode == "init":
        harness.initialize()
        print(f"[spiral] Initialized. {len(harness.state.features)} features ready.")
        return

    if args.mode == "forever":
        harness.run_forever()
    else:
        harness.run()


if __name__ == "__main__":
    main()
