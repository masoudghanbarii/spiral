from __future__ import annotations

from spiral.config import Config
from spiral.llm import LLMClient
from spiral.managers import ManagerRegistry
from spiral.models import (
    Feature,
    GradingResult,
    TraceEntry,
    TraceEventType,
    VerificationStatus,
)
from spiral.tools.registry import ToolRegistry


class VerificationLoop:
    def __init__(
        self,
        config: Config,
        managers: ManagerRegistry,
        llm: LLMClient,
        tools: ToolRegistry,
    ):
        self.config = config
        self.managers = managers
        self.llm = llm
        self.tools = tools

    def grade(self, feature: Feature, agent_output: str) -> GradingResult:
        self.managers.traces.record(
            TraceEntry(
                event_type=TraceEventType.VERIFICATION,
                loop_name="verifier",
                feature=feature.name,
                data={"action": "start"},
            )
        )

        rubric = self._build_rubric(feature)
        prompt = f"""Grade the implementation of feature '{feature.name}' against this rubric:

RUBRIC:
{rubric}

FEATURE DESCRIPTION:
{feature.description}

ADR SECTION:
{feature.adr_section}

AGENT OUTPUT:
{agent_output[:3000]}

Return JSON:
{{"status": "pass"|"fail", "score": 0.0-1.0, "feedback": "detailed feedback", "rubric_breakdown": {{"criterion_name": true|false}}}}
"""

        response = self.llm.generate(
            prompt,
            system="You are a strict code reviewer. Grade implementations against the rubric.",
        )
        result = self.llm.extract_json(response) or {
            "status": "error",
            "score": 0.0,
            "feedback": "Could not parse grading response",
        }

        grade = GradingResult(
            status=VerificationStatus(result.get("status", "error")),
            score=result.get("score", 0.0),
            feedback=result.get("feedback", ""),
            rubric_breakdown=result.get("rubric_breakdown", {}),
        )

        self.managers.traces.record(
            TraceEntry(
                event_type=TraceEventType.VERIFICATION,
                loop_name="verifier",
                feature=feature.name,
                data={
                    "status": grade.status.value,
                    "score": grade.score,
                    "feedback": grade.feedback[:200],
                },
            )
        )

        return grade

    def _build_rubric(self, feature: Feature) -> str:
        return f"""1. Implementation matches ADR specification for section '{feature.adr_section}'
2. Code follows project conventions (type hints, async, Pydantic)
3. Unit tests exist with adequate coverage
4. No breaking changes to existing interfaces
5. Error handling is appropriate
6. Security: no hardcoded secrets, proper input validation"""

    def run(self, feature: Feature, agent_output: str) -> tuple[bool, GradingResult]:
        for attempt in range(self.config.MAX_VERIFICATION_RETRIES):
            grade = self.grade(feature, agent_output)
            if grade.status == VerificationStatus.PASS:
                return True, grade

            feature.last_feedback = grade.feedback
            feature.implementation_attempts += 1

            self.managers.traces.record(
                TraceEntry(
                    event_type=TraceEventType.VERIFICATION_RETRY,
                    loop_name="verifier",
                    feature=feature.name,
                    data={"attempt": attempt + 1, "feedback": grade.feedback[:200]},
                )
            )

            if attempt < self.config.MAX_VERIFICATION_RETRIES - 1:
                agent_output = self._retry_implementation(feature, grade.feedback)

        return False, grade

    def _retry_implementation(self, feature: Feature, feedback: str) -> str:
        from spiral.loops.agent import AgentLoop

        agent = AgentLoop(self.config, self.managers, self.llm, self.tools)
        feature.last_feedback = feedback
        return agent.run(feature)
