from __future__ import annotations

import json

from spiral.config import Config
from spiral.llm import LLMClient
from spiral.managers import ManagerRegistry
from spiral.models import HarnessState, TraceEntry, TraceEventType


class EngineAnalysisLoop:
    def __init__(self, config: Config, managers: ManagerRegistry, llm: LLMClient):
        self.config = config
        self.managers = managers
        self.llm = llm
        self.analysis_count = 0

    def analyze(self, state: HarnessState) -> list[str]:
        self.analysis_count += 1
        self.managers.traces.record(
            TraceEntry(
                event_type=TraceEventType.ENGINE_ANALYSIS,
                loop_name="engine",
                feature="*",
                data={"count": self.analysis_count},
            )
        )

        traces_feed = self.managers.traces.get_engine_feed()
        prompt = f"""You are the meta-analysis engine for Spiral AI co-founder.

Review execution traces and suggest harness improvements.

Current state:
- Completed features: {state.completed_features}
- Failed features: {state.failed_features}
- Total iterations: {state.total_agent_iterations}
- Total verifications: {state.total_verification_runs}

Recent traces:
{traces_feed[:4000]}

Analyze patterns:
1. Are there recurring failures? Suggest prompt or rubric changes.
2. Are tools being used effectively? Suggest tool config changes.
3. Is the agent missing context? Suggest system prompt improvements.
4. Are verification criteria too strict or too loose? Suggest rubric changes.

Return JSON:
{{"improvements": ["improvement1", "improvement2", ...], "prompt_changes": "...", "rubric_changes": {{"key": "value"}}, "tool_changes": {{"key": "value"}}}}
"""

        response = self.llm.generate(
            prompt,
            system="You analyze agent execution traces and suggest harness improvements.",
        )
        result = self.llm.extract_json(response) or {
            "improvements": [],
            "prompt_changes": "",
            "rubric_changes": {},
            "tool_changes": {},
        }

        improvements = result.get("improvements", [])

        if result.get("prompt_changes"):
            state.system_prompt = result["prompt_changes"]
            improvements.append(
                f"System prompt updated: {result['prompt_changes'][:100]}"
            )

        if result.get("rubric_changes"):
            state.rubrics.update(result["rubric_changes"])
            improvements.append(
                f"Rubrics updated: {json.dumps(result['rubric_changes'])[:100]}"
            )

        if result.get("tool_changes"):
            state.tool_config.update(result["tool_changes"])
            improvements.append(
                f"Tool config updated: {json.dumps(result['tool_changes'])[:100]}"
            )

        state.harness_improvements.extend(improvements)
        state.total_engine_analyses += 1

        for imp in improvements:
            self.managers.traces.record(
                TraceEntry(
                    event_type=TraceEventType.HARNESS_IMPROVEMENT,
                    loop_name="engine",
                    feature="*",
                    data={"improvement": imp},
                )
            )

        self.managers.state.save(state)
        return improvements

    def should_analyze(self, state: HarnessState) -> bool:
        return (
            self.analysis_count == 0
            or len(state.completed_features) % self.config.ENGINE_ANALYSIS_INTERVAL == 0
            or len(state.failed_features) > self.analysis_count * 2
        )
