from __future__ import annotations

import json
from typing import Any

from spiral.config import Config
from spiral.context import ContextManager
from spiral.llm import LLMClient
from spiral.managers import ManagerRegistry
from spiral.models import Feature, TraceEntry, TraceEventType
from spiral.modes import AgentMode, get_system_prompt_suffix
from spiral.tools.registry import ToolRegistry


class AgentLoop:
    def __init__(
        self,
        config: Config,
        managers: ManagerRegistry,
        llm: LLMClient,
        tools: ToolRegistry,
        agent_mode: AgentMode = AgentMode.NORMAL,
    ):
        self.config = config
        self.managers = managers
        self.llm = llm
        self.tools = tools
        self.agent_mode = agent_mode
        self.context = ContextManager(config, llm, managers.traces)
        self.interactive: Any | None = None
        if agent_mode == AgentMode.INTERACTIVE:
            from spiral.interactive import InteractiveMode

            self.interactive = InteractiveMode(managers)
            self.interactive.start()
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        ctx = self.managers.project.get_project_context()
        mode_suffix = get_system_prompt_suffix(self.agent_mode)
        return f"""You are Spiral, the AI co-founder.

You are implementing features from the ADR. Follow software engineering best practices:
- Type hints everywhere
- Write clean async/await code for I/O; this project uses FastAPI and async SQLAlchemy.
- Pydantic models for request/response
- Unit tests with 80%+ coverage
- Standard naming conventions
- No comments unless explaining WHY

Project context:
{json.dumps(ctx, indent=2)[:2000]}

Before implementing, use find_skills to discover relevant skills (TDD, etc).
After implementing, run tests and lint. Fix any issues.
Mark ADR sections as Done when complete.

You have tools to read/write files, run commands, and manage the project.
Think step by step. Use tools as needed. When done, output FINAL_RESULT with a summary.{mode_suffix}"""

    def _detect_loop(self, tool_calls: list[dict[str, Any]]) -> str | None:
        """Detect repeated file reads without writes. Returns warning message if loop detected."""
        read_counts: dict[str, int] = {}
        for tc in tool_calls:
            fn = tc.get("function", {})
            name = fn.get("name", "")
            args = fn.get("arguments", "{}")
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except json.JSONDecodeError:
                    continue
            if name in ("read_file", "run_command"):
                key = f"{name}:{args.get('file_path', args.get('command', ''))}"
                read_counts[key] = read_counts.get(key, 0) + 1
        repeated = [k for k, v in read_counts.items() if v >= 3]
        if repeated:
            return (
                f"ANTI-LOOP WARNING: You have repeatedly read the same file(s) {repeated}. "
                "STOP reading and START writing code. Use write_file or edit_file NOW. "
                "If you need to verify something, write a test and run it."
            )
        return None

    def run(self, feature: Feature, system_prompt: str | None = None) -> str:
        self.managers.traces.record(
            TraceEntry(
                event_type=TraceEventType.AGENT_STEP,
                loop_name="agent",
                feature=feature.name,
                data={"action": "start"},
            )
        )

        messages = [
            {
                "role": "system",
                "content": system_prompt
                if system_prompt is not None
                else self.system_prompt,
            },
            {
                "role": "user",
                "content": f"Implement feature: {feature.name}\n\nDescription: {feature.description}\n\nADR Section: {feature.adr_section}\n\nPrevious feedback: {feature.last_feedback}",
            },
        ]

        recent_tool_calls: list[dict[str, Any]] = []

        for iteration in range(self.config.MAX_AGENT_ITERATIONS):
            if self.interactive:
                if self.interactive.should_stop:
                    return "FINAL_RESULT: Stopped by user"
                while self.interactive.is_paused:
                    import time

                    time.sleep(0.5)
                    if self.interactive.should_stop:
                        return "FINAL_RESULT: Stopped by user"
                msg = self.interactive.get_pending_message()
                if msg:
                    messages.append(msg)
            messages = self.context.ensure_fits(messages)
            self.managers.status.write(
                {
                    "loop": "agent",
                    "phase": "llm_wait",
                    "feature": feature.name,
                    "iteration": iteration,
                    "attempt": feature.implementation_attempts + 1,
                    "context_tokens": self.context.get_token_count(messages),
                }
            )
            if self.config.STREAM_ENABLED:
                response = self.llm.chat_stream(
                    messages, tools=self.tools.get_tool_definitions()
                )
            else:
                response = self.llm.chat(
                    messages, tools=self.tools.get_tool_definitions()
                )
            msg = response.get("message", {})

            if msg.get("content"):
                content = msg["content"]
                if "FINAL_RESULT" in content:
                    self.managers.traces.record(
                        TraceEntry(
                            event_type=TraceEventType.AGENT_STEP,
                            loop_name="agent",
                            feature=feature.name,
                            data={"action": "complete", "iterations": iteration},
                        )
                    )
                    self.managers.status.write(
                        {
                            "loop": "agent",
                            "phase": "complete",
                            "feature": feature.name,
                            "iterations": iteration,
                        }
                    )
                    return content

            tool_calls = msg.get("tool_calls", [])
            if not tool_calls:
                messages.append(
                    {"role": "assistant", "content": msg.get("content", "")}
                )
                continue

            recent_tool_calls.extend(tool_calls)
            # Keep only last 20 tool calls for loop detection window
            if len(recent_tool_calls) > 20:
                recent_tool_calls = recent_tool_calls[-20:]

            for tc in tool_calls:
                func_name = tc.get("function", {}).get("name", "")
                func_args = {}
                try:
                    raw = tc.get("function", {}).get("arguments", "{}")
                    func_args = json.loads(raw) if isinstance(raw, str) else raw
                except json.JSONDecodeError:
                    func_args = {}

                self.managers.traces.record(
                    TraceEntry(
                        event_type=TraceEventType.TOOL_CALL,
                        loop_name="agent",
                        feature=feature.name,
                        data={"tool": func_name, "args": func_args},
                    )
                )

                self.managers.status.write(
                    {
                        "loop": "agent",
                        "phase": "tool_executing",
                        "feature": feature.name,
                        "tool": func_name,
                        "iteration": iteration,
                    }
                )
                result = self.tools.execute(func_name, func_args)

                self.managers.traces.record(
                    TraceEntry(
                        event_type=TraceEventType.TOOL_RESULT,
                        loop_name="agent",
                        feature=feature.name,
                        data={"tool": func_name, "result": result[:500]},
                    )
                )

                messages.append(
                    {"role": "assistant", "content": msg.get("content", "")}
                )
                messages.append(
                    {
                        "role": "tool",
                        "content": result[:2000],
                        "tool_call_id": tc.get("id", ""),
                    }
                )

            loop_warning = self._detect_loop(recent_tool_calls)
            if loop_warning:
                messages.append({"role": "user", "content": loop_warning})
                self.managers.traces.record(
                    TraceEntry(
                        event_type=TraceEventType.AGENT_STEP,
                        loop_name="agent",
                        feature=feature.name,
                        data={"action": "anti_loop_warning", "message": loop_warning},
                    )
                )

        self.managers.traces.record(
            TraceEntry(
                event_type=TraceEventType.ERROR,
                loop_name="agent",
                feature=feature.name,
                data={"error": "max_iterations"},
            )
        )
        self.managers.status.write(
            {
                "loop": "agent",
                "phase": "max_iterations",
                "feature": feature.name,
            }
        )
        return "FINAL_RESULT: Max iterations reached without completion."
