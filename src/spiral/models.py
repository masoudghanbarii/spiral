from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any


class TraceEventType(str, Enum):
    AGENT_STEP = "agent_step"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    VERIFICATION = "verification"
    VERIFICATION_RETRY = "verification_retry"
    EVENT_TRIGGER = "event_trigger"
    EVENT_COMPLETE = "event_complete"
    ENGINE_ANALYSIS = "engine_analysis"
    HARNESS_IMPROVEMENT = "harness_improvement"
    ERROR = "error"


class VerificationStatus(str, Enum):
    PASS = "pass"
    FAIL = "fail"
    ERROR = "error"


@dataclass
class TraceEntry:
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    event_type: TraceEventType = TraceEventType.AGENT_STEP
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    loop_name: str = ""
    feature: str = ""
    data: dict[str, Any] = field(default_factory=dict)
    parent_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "event_type": self.event_type.value,
            "timestamp": self.timestamp,
            "loop_name": self.loop_name,
            "feature": self.feature,
            "data": self.data,
            "parent_id": self.parent_id,
        }

    @classmethod
    def from_dict(cls, d: dict) -> TraceEntry:
        return cls(
            id=d["id"],
            event_type=TraceEventType(d["event_type"]),
            timestamp=d["timestamp"],
            loop_name=d["loop_name"],
            feature=d["feature"],
            data=d["data"],
            parent_id=d.get("parent_id"),
        )


@dataclass
class GradingResult:
    status: VerificationStatus
    score: float
    feedback: str = ""
    rubric_breakdown: dict[str, bool] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status.value,
            "score": self.score,
            "feedback": self.feedback,
            "rubric_breakdown": self.rubric_breakdown,
        }


@dataclass
class Feature:
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    name: str = ""
    description: str = ""
    adr_section: str = ""
    status: str = "pending"
    implementation_attempts: int = 0
    last_feedback: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "adr_section": self.adr_section,
            "status": self.status,
            "implementation_attempts": self.implementation_attempts,
            "last_feedback": self.last_feedback,
        }


@dataclass
class HarnessState:
    features: list[Feature] = field(default_factory=list)
    current_feature_index: int = 0
    completed_features: list[str] = field(default_factory=list)
    failed_features: list[str] = field(default_factory=list)
    total_agent_iterations: int = 0
    total_verification_runs: int = 0
    total_engine_analyses: int = 0
    harness_improvements: list[str] = field(default_factory=list)
    system_prompt: str = ""
    rubrics: dict[str, Any] = field(default_factory=dict)
    tool_config: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "features": [f.to_dict() for f in self.features],
            "current_feature_index": self.current_feature_index,
            "completed_features": self.completed_features,
            "failed_features": self.failed_features,
            "total_agent_iterations": self.total_agent_iterations,
            "total_verification_runs": self.total_verification_runs,
            "total_engine_analyses": self.total_engine_analyses,
            "harness_improvements": self.harness_improvements,
            "system_prompt": self.system_prompt,
            "rubrics": self.rubrics,
            "tool_config": self.tool_config,
        }

    @classmethod
    def from_dict(cls, d: dict) -> HarnessState:
        return cls(
            features=[
                Feature(**f) if isinstance(f, dict) else f
                for f in d.get("features", [])
            ],
            current_feature_index=d.get("current_feature_index", 0),
            completed_features=d.get("completed_features", []),
            failed_features=d.get("failed_features", []),
            total_agent_iterations=d.get("total_agent_iterations", 0),
            total_verification_runs=d.get("total_verification_runs", 0),
            total_engine_analyses=d.get("total_engine_analyses", 0),
            harness_improvements=d.get("harness_improvements", []),
            system_prompt=d.get("system_prompt", ""),
            rubrics=d.get("rubrics", {}),
            tool_config=d.get("tool_config", {}),
        )
