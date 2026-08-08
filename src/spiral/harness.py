from __future__ import annotations

from datetime import UTC, datetime

from spiral.config import Config
from spiral.llm import LLMClient
from spiral.loops.agent import AgentLoop
from spiral.loops.engine import EngineAnalysisLoop
from spiral.loops.event_driver import EventDriver
from spiral.loops.verifier import VerificationLoop
from spiral.managers import ManagerRegistry
from spiral.models import HarnessState
from spiral.modes import AgentMode
from spiral.tools.registry import ToolRegistry


class Harness:
    def __init__(self, config: Config | None = None):
        self.config = config or Config()
        self.agent_mode = AgentMode(self.config.AGENT_MODE)
        self.managers = ManagerRegistry(self.config)
        self.llm = LLMClient(self.config)
        if self.agent_mode == AgentMode.BYPASS:
            self.config.AUTO_APPROVE = True
            self.managers.permissions.auto_approve = True
        self.tools = ToolRegistry(
            self.config,
            self.managers.project,
            self.managers.permissions,
            agent_mode=self.agent_mode,
        )
        self.agent = AgentLoop(
            self.config, self.managers, self.llm, self.tools, self.agent_mode
        )
        self.verifier = VerificationLoop(
            self.config, self.managers, self.llm, self.tools
        )
        self.event_driver = EventDriver(self.config, self.managers, self.llm)
        self.engine = EngineAnalysisLoop(self.config, self.managers, self.llm)
        self.state: HarnessState | None = None
        self._mode = "run"
        self.session = self.managers.memory.create_session()
        self._inject_project_memory()
        self.managers.status.clear()

    def _inject_project_memory(self) -> None:
        project_ctx = self.managers.memory.project.get_context_for_prompt()
        if project_ctx:
            existing = self.agent.system_prompt
            if project_ctx not in existing:
                self.agent.system_prompt = (
                    existing + f"\n\nProject memory:\n{project_ctx}"
                )

    def _write_status(
        self, loop: str, phase: str, feature: str = "", **extra: object
    ) -> None:
        self.managers.status.write(
            {
                "loop": loop,
                "phase": phase,
                "feature": feature,
                "mode": self._mode,
                "agent_mode": self.agent_mode.value,
                **extra,
            }
        )

    def initialize(self) -> None:
        self.state = self.managers.state.load()
        if self.state is None:
            self.state = HarnessState()
            self.state.features = self.event_driver.generate_events_from_adr(self.state)
            self.state.system_prompt = self.agent.system_prompt
            self.managers.state.save(self.state)
            print(
                f"[spiral] Initialized with {len(self.state.features)} features from ADR"
            )
        else:
            print(
                f"[spiral] Resumed: {len(self.state.completed_features)} done, "
                f"{len(self.state.failed_features)} failed, "
                f"{len(self.state.features) - self.state.current_feature_index} remaining"
            )
        self.session.save_context(
            {
                "mode": self._mode,
                "started": datetime.now(UTC).isoformat(),
                "model": self.config.MODEL,
                "agent_mode": self.agent_mode.value,
            }
        )
        self.session.save_state(self.state.to_dict())

    def run(self) -> None:
        self.initialize()

        while self.event_driver.has_more_work(self.state):
            feature = self.event_driver.get_next_feature(self.state)
            if feature is None:
                break

            print(f"\n{'=' * 60}")
            print(f"[spiral] FEATURE: {feature.name}")
            print(f"[spiral] Section: {feature.adr_section}")
            print(f"[spiral] Attempt: {feature.implementation_attempts + 1}")
            print(f"{'=' * 60}")

            self.state.total_agent_iterations += 1

            self._write_status(
                "agent",
                "start",
                feature.name,
                attempt=feature.implementation_attempts + 1,
            )
            agent_output = self.agent.run(feature, self.state.system_prompt or None)

            self.state.total_verification_runs += 1
            self._write_status("verifier", "grading", feature.name)
            passed, grade = self.verifier.run(feature, agent_output)

            if passed:
                print(f"[spiral] PASSED (score: {grade.score:.2f})")
                self.event_driver.on_feature_complete(self.state, feature)
                self.session.archive_feature(feature.name)
            else:
                print(f"[spiral] FAILED (score: {grade.score:.2f})")
                print(f"[spiral] Feedback: {grade.feedback[:200]}")
                self.event_driver.on_feature_failed(self.state, feature)
                self.managers.memory.project.add_failure(
                    {
                        "feature": feature.name,
                        "feedback": grade.feedback[:500],
                        "attempts": feature.implementation_attempts,
                    }
                )

            if self.engine.should_analyze(self.state):
                print("\n[spiral] ENGINE ANALYSIS...")
                self._write_status("engine", "analyzing", feature="*")
                improvements = self.engine.analyze(self.state)
                for imp in improvements:
                    print(f"  [engine] {imp}")

            self.managers.state.save(self.state)
            self.session.save_state(self.state.to_dict())

        print(f"\n{'=' * 60}")
        print("[spiral] WORK COMPLETE")
        print(f"  Completed: {len(self.state.completed_features)}")
        print(f"  Failed: {len(self.state.failed_features)}")
        print(f"  Agent iterations: {self.state.total_agent_iterations}")
        print(f"  Verification runs: {self.state.total_verification_runs}")
        print(f"  Engine analyses: {self.state.total_engine_analyses}")
        print(f"  Harness improvements: {len(self.state.harness_improvements)}")
        print(f"{'=' * 60}")
        self._write_status("harness", "idle", feature="*")

    def run_forever(self) -> None:
        self._mode = "forever"
        self.initialize()
        cycle = 0

        while True:
            cycle += 1
            print(f"\n[spiral] CYCLE {cycle}")

            if self.event_driver.has_more_work(self.state):
                self._process_next_feature()
            else:
                print("[spiral] All features done. Regenerating from ADR...")
                self._write_status("event", "regenerating", feature="*")
                new_features = self.event_driver.generate_events_from_adr(self.state)
                existing_names = {f.name for f in self.state.features}
                fresh = [f for f in new_features if f.name not in existing_names]
                if fresh:
                    self.state.features.extend(fresh)
                    print(f"[spiral] Added {len(fresh)} new features")
                else:
                    print("[spiral] No new features. Running engine analysis...")
                    self.engine.analyze(self.state)

            self.managers.state.save(self.state)

    def _process_next_feature(self) -> None:
        feature = self.event_driver.get_next_feature(self.state)
        if feature is None:
            return

        print(f"\n[spiral] FEATURE: {feature.name}")

        self.state.total_agent_iterations += 1
        self._write_status(
            "agent", "start", feature.name, attempt=feature.implementation_attempts + 1
        )
        agent_output = self.agent.run(feature, self.state.system_prompt or None)

        self.state.total_verification_runs += 1
        self._write_status("verifier", "grading", feature.name)
        passed, grade = self.verifier.run(feature, agent_output)

        if passed:
            print(f"[spiral] PASSED ({grade.score:.2f})")
            self.event_driver.on_feature_complete(self.state, feature)
        else:
            print(f"[spiral] FAILED ({grade.score:.2f})")
            self.event_driver.on_feature_failed(self.state, feature)

        if self.engine.should_analyze(self.state):
            self._write_status("engine", "analyzing", feature="*")
            self.engine.analyze(self.state)
