from __future__ import annotations

import asyncio

from spiral.config import Config
from spiral.llm import LLMClient
from spiral.managers import ManagerRegistry
from spiral.models import Feature
from spiral.tools.registry import ToolRegistry


class SubagentManager:
    def __init__(
        self,
        config: Config,
        managers: ManagerRegistry,
        llm: LLMClient,
        max_concurrent: int = 1,
    ):
        self.config = config
        self.managers = managers
        self.llm = llm
        self.max_concurrent = max_concurrent
        self._results: dict[str, str] = {}
        self._lock = asyncio.Lock()

    async def run_feature(
        self,
        feature: Feature,
        system_prompt: str | None,
        tools: ToolRegistry,
    ) -> tuple[str, str]:
        from spiral.loops.agent import AgentLoop

        agent = AgentLoop(
            self.config, self.managers, self.llm, tools, self.managers.permissions
        )
        loop = asyncio.get_event_loop()
        output = await loop.run_in_executor(None, agent.run, feature, system_prompt)
        return feature.name, output

    async def run_parallel(
        self,
        features: list[Feature],
        system_prompt: str | None,
        tools: ToolRegistry,
    ) -> dict[str, str]:
        semaphore = asyncio.Semaphore(self.max_concurrent)

        async def _run(feat: Feature) -> tuple[str, str]:
            async with semaphore:
                return await self.run_feature(feat, system_prompt, tools)

        tasks = [_run(f) for f in features]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        output: dict[str, str] = {}
        for r in results:
            if isinstance(r, tuple):
                output[r[0]] = r[1]
            elif isinstance(r, Exception):
                output[f"error_{id(r)}"] = str(r)
        self._results.update(output)
        return output

    def get_results(self) -> dict[str, str]:
        return self._results
