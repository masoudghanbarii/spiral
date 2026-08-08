from __future__ import annotations

from spiral.config import Config
from spiral.llm import LLMClient
from spiral.managers import ManagerRegistry
from spiral.models import Feature, HarnessState, TraceEntry, TraceEventType


class EventDriver:
    def __init__(self, config: Config, managers: ManagerRegistry, llm: LLMClient):
        self.config = config
        self.managers = managers
        self.llm = llm

    def get_next_feature(self, state: HarnessState) -> Feature | None:
        if state.current_feature_index < len(state.features):
            return state.features[state.current_feature_index]
        return None

    def on_feature_complete(self, state: HarnessState, feature: Feature) -> None:
        state.completed_features.append(feature.name)
        state.current_feature_index += 1
        feature.status = "completed"

        self.managers.traces.record(
            TraceEntry(
                event_type=TraceEventType.EVENT_COMPLETE,
                loop_name="event_driver",
                feature=feature.name,
                data={"status": "completed", "next_index": state.current_feature_index},
            )
        )

        self.managers.project.mark_adr_done(feature.adr_section)
        self.managers.state.save(state)

    def on_feature_failed(self, state: HarnessState, feature: Feature) -> None:
        state.failed_features.append(feature.name)
        state.current_feature_index += 1
        feature.status = "failed"

        self.managers.traces.record(
            TraceEntry(
                event_type=TraceEventType.ERROR,
                loop_name="event_driver",
                feature=feature.name,
                data={"status": "failed"},
            )
        )

        self.managers.state.save(state)

    def has_more_work(self, state: HarnessState) -> bool:
        return state.current_feature_index < len(state.features)

    def generate_events_from_adr(
        self, state: HarnessState | None = None
    ) -> list[Feature]:
        adr = self.managers.project.read_adr()
        prompt_parts = [
            """Parse this ADR and extract all implementable features as a JSON array.
Each feature needs: name, description, adr_section.""",
        ]
        if state is not None and state.harness_improvements:
            improvements = "\n".join(state.harness_improvements)
            prompt_parts.append(
                f"Previous harness improvements from meta-analysis:\n{improvements}"
            )
        prompt_parts.extend(
            [
                f"\nADR:\n{adr[:8000]}",
                'Return JSON array: [{"name": "...", "description": "...", "adr_section": "..."}]\nInclude ALL sections that need implementation: services, packages, infra, db, local-agent, etc.',
            ]
        )
        prompt = "\n\n".join(prompt_parts)

        response = self.llm.generate(
            prompt,
            system="You extract implementable features from architecture documents.",
        )
        features_data = self.llm.extract_json(response)

        if not features_data:
            return []

        return [Feature(**f) for f in features_data if isinstance(f, dict)]
