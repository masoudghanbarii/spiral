from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from spiral.config import Config
from spiral.harness import Harness
from spiral.llm import LLMClient
from spiral.loops.agent import AgentLoop
from spiral.loops.engine import EngineAnalysisLoop
from spiral.loops.event_driver import EventDriver
from spiral.loops.verifier import VerificationLoop
from spiral.managers import ManagerRegistry
from spiral.managers.project import ProjectManager
from spiral.managers.skills import SkillsManager
from spiral.models import (
    Feature,
    HarnessState,
    VerificationStatus,
)
from spiral.tools.registry import ToolRegistry


@pytest.fixture
def config(tmp_path: Path) -> Config:
    c = Config()
    c.SPIRAL_DIR = tmp_path / "spiral"
    c.TRACES_DIR = tmp_path / "spiral" / "traces"
    c.STATE_FILE = tmp_path / "spiral" / "state.json"
    c.SKILLS_DIR = tmp_path / "spiral" / "skills"
    c.PROJECT_DIR = tmp_path / "project"
    c.PROJECT_DIR.mkdir(parents=True, exist_ok=True)
    c.ADR_PATH = c.PROJECT_DIR / "docs" / "adr" / "001-architecture.md"
    c.ADR_PATH.parent.mkdir(parents=True, exist_ok=True)
    c.AGENTS_PATH = c.PROJECT_DIR / "AGENTS.md"
    return c


@pytest.fixture
def managers(config: Config) -> ManagerRegistry:
    return ManagerRegistry(config)


@pytest.fixture
def llm(config: Config) -> LLMClient:
    return LLMClient(config)


class TestAgentLoop:
    def test_run_with_final_result(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        tools = MagicMock(spec=ToolRegistry)
        tools.get_tool_definitions.return_value = []
        with patch.object(AgentLoop, "_build_system_prompt", return_value="prompt"):
            agent = AgentLoop(config, managers, llm, tools)
        feature = Feature(name="test", description="desc", adr_section="sec")

        with patch.object(llm, "chat") as mock_chat:
            mock_chat.return_value = {"message": {"content": "FINAL_RESULT: done"}}
            result = agent.run(feature)

        assert "FINAL_RESULT" in result
        mock_chat.assert_called_once()

    def test_run_with_tool_calls(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        tools = MagicMock(spec=ToolRegistry)
        tools.get_tool_definitions.return_value = []
        tools.execute.return_value = "tool result"
        with patch.object(AgentLoop, "_build_system_prompt", return_value="prompt"):
            agent = AgentLoop(config, managers, llm, tools)
        feature = Feature(name="test", description="desc", adr_section="sec")

        with patch.object(llm, "chat") as mock_chat:
            mock_chat.side_effect = [
                {
                    "message": {
                        "content": "",
                        "tool_calls": [
                            {
                                "function": {"name": "read_file", "arguments": "{}"},
                                "id": "tc1",
                            }
                        ],
                    }
                },
                {"message": {"content": "FINAL_RESULT: done"}},
            ]
            result = agent.run(feature)

        assert "FINAL_RESULT" in result
        assert mock_chat.call_count == 2

    def test_run_max_iterations(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        config.MAX_AGENT_ITERATIONS = 2
        tools = MagicMock(spec=ToolRegistry)
        tools.get_tool_definitions.return_value = []
        with patch.object(AgentLoop, "_build_system_prompt", return_value="prompt"):
            agent = AgentLoop(config, managers, llm, tools)
        feature = Feature(name="test", description="desc", adr_section="sec")

        with patch.object(llm, "chat") as mock_chat:
            mock_chat.return_value = {"message": {"content": "intermediate"}}
            result = agent.run(feature)

        assert "Max iterations reached" in result
        assert mock_chat.call_count == 2

    def test_run_with_custom_system_prompt(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        tools = MagicMock(spec=ToolRegistry)
        tools.get_tool_definitions.return_value = []
        with patch.object(AgentLoop, "_build_system_prompt", return_value="prompt"):
            agent = AgentLoop(config, managers, llm, tools)
        feature = Feature(name="test", description="desc", adr_section="sec")

        with patch.object(llm, "chat") as mock_chat:
            mock_chat.return_value = {"message": {"content": "FINAL_RESULT: done"}}
            agent.run(feature, system_prompt="custom prompt")

        call_messages = mock_chat.call_args[0][0]
        assert call_messages[0]["content"] == "custom prompt"


class TestVerificationLoop:
    def test_run_pass_first_try(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        tools = MagicMock(spec=ToolRegistry)
        verifier = VerificationLoop(config, managers, llm, tools)
        feature = Feature(name="test", description="desc", adr_section="sec")

        with (
            patch.object(llm, "generate") as mock_gen,
            patch.object(llm, "extract_json") as mock_extract,
        ):
            mock_gen.return_value = (
                '{"status": "pass", "score": 0.95, "feedback": "good"}'
            )
            mock_extract.return_value = {
                "status": "pass",
                "score": 0.95,
                "feedback": "good",
            }
            passed, grade = verifier.run(feature, "output")

        assert passed is True
        assert grade.status == VerificationStatus.PASS

    def test_run_fail_then_retry_then_pass(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        config.MAX_VERIFICATION_RETRIES = 3
        tools = MagicMock(spec=ToolRegistry)
        tools.get_tool_definitions.return_value = []
        verifier = VerificationLoop(config, managers, llm, tools)
        feature = Feature(name="test", description="desc", adr_section="sec")

        with (
            patch.object(llm, "generate") as mock_gen,
            patch.object(llm, "extract_json") as mock_extract,
            patch.object(
                verifier, "_retry_implementation", return_value="retried output"
            ),
        ):
            mock_gen.return_value = "response"
            mock_extract.side_effect = [
                {"status": "fail", "score": 0.3, "feedback": "bad"},
                {"status": "pass", "score": 0.9, "feedback": "good"},
            ]
            passed, grade = verifier.run(feature, "output")

        assert passed is True
        assert grade.status == VerificationStatus.PASS

    def test_run_fail_all_retries(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        config.MAX_VERIFICATION_RETRIES = 2
        tools = MagicMock(spec=ToolRegistry)
        tools.get_tool_definitions.return_value = []
        verifier = VerificationLoop(config, managers, llm, tools)
        feature = Feature(name="test", description="desc", adr_section="sec")

        with (
            patch.object(llm, "generate") as mock_gen,
            patch.object(llm, "extract_json") as mock_extract,
            patch.object(
                verifier, "_retry_implementation", return_value="retried output"
            ),
        ):
            mock_gen.return_value = "response"
            mock_extract.return_value = {
                "status": "fail",
                "score": 0.2,
                "feedback": "bad",
            }
            passed, grade = verifier.run(feature, "output")

        assert passed is False
        assert grade.status == VerificationStatus.FAIL


class TestEventDriver:
    def test_get_next_feature(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        ed = EventDriver(config, managers, llm)
        state = HarnessState()
        state.features = [Feature(name="f1"), Feature(name="f2")]
        assert ed.get_next_feature(state).name == "f1"

    def test_on_feature_complete_advances_index(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        config.ADR_PATH.write_text("# ADR\n## Section 1\ncontent")
        config.AGENTS_PATH.write_text("# Agents")
        ed = EventDriver(config, managers, llm)
        state = HarnessState()
        state.features = [Feature(name="f1", adr_section="Section 1")]
        ed.on_feature_complete(state, state.features[0])
        assert state.current_feature_index == 1
        assert "f1" in state.completed_features

    def test_has_more_work(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        ed = EventDriver(config, managers, llm)
        state = HarnessState()
        state.features = [Feature(name="f1")]
        assert ed.has_more_work(state) is True
        state.current_feature_index = 1
        assert ed.has_more_work(state) is False

    def test_generate_events_from_adr_with_state(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        config.ADR_PATH.write_text("# ADR\n## Section 1\ncontent")
        config.AGENTS_PATH.write_text("# Agents")
        ed = EventDriver(config, managers, llm)
        state = HarnessState()
        state.harness_improvements = ["improvement 1"]

        with (
            patch.object(llm, "generate") as mock_gen,
            patch.object(llm, "extract_json") as mock_extract,
        ):
            mock_gen.return_value = (
                '[{"name": "f1", "description": "d", "adr_section": "Section 1"}]'
            )
            mock_extract.return_value = [
                {"name": "f1", "description": "d", "adr_section": "Section 1"}
            ]
            features = ed.generate_events_from_adr(state)

        assert len(features) == 1
        assert features[0].name == "f1"
        prompt = mock_gen.call_args[0][0]
        assert "improvement 1" in prompt


class TestEngineAnalysisLoop:
    def test_analyze_with_mocked_traces(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        engine = EngineAnalysisLoop(config, managers, llm)
        state = HarnessState()
        state.completed_features = ["f1"]

        with (
            patch.object(llm, "generate") as mock_gen,
            patch.object(llm, "extract_json") as mock_extract,
        ):
            mock_gen.return_value = '{"improvements": ["fix rubric"], "prompt_changes": "new prompt", "rubric_changes": {"k": "v"}, "tool_changes": {"t": "v"}}'
            mock_extract.return_value = {
                "improvements": ["fix rubric"],
                "prompt_changes": "new prompt",
                "rubric_changes": {"k": "v"},
                "tool_changes": {"t": "v"},
            }
            improvements = engine.analyze(state)

        assert len(improvements) > 0
        assert state.system_prompt == "new prompt"
        assert state.total_engine_analyses == 1

    def test_should_analyze_first_time(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        engine = EngineAnalysisLoop(config, managers, llm)
        state = HarnessState()
        assert engine.should_analyze(state) is True

    def test_should_analyze_at_interval(
        self, config: Config, managers: ManagerRegistry, llm: LLMClient
    ) -> None:
        engine = EngineAnalysisLoop(config, managers, llm)
        engine.analysis_count = 1
        state = HarnessState()
        state.completed_features = ["f1", "f2", "f3", "f4", "f5"]
        assert engine.should_analyze(state) is True


class TestToolRegistry:
    def test_execute_unknown_tool(
        self, config: Config, managers: ManagerRegistry
    ) -> None:
        tools = ToolRegistry(config, managers.project)
        result = tools.execute("unknown_tool", {})
        assert "unknown tool" in result

    def test_run_tests_justfile_fallback(
        self, config: Config, managers: ManagerRegistry
    ) -> None:
        (config.PROJECT_DIR / "justfile").write_text("test:\n    echo ok")
        tools = ToolRegistry(config, managers.project)
        with patch.object(managers.project, "run_command") as mock_run:
            mock_run.return_value = MagicMock(stdout="ok", stderr="")
            tools.run_tests()
            assert mock_run.call_args[0][0][0] == "just"

    def test_run_tests_make_fallback(
        self, config: Config, managers: ManagerRegistry
    ) -> None:
        (config.PROJECT_DIR / "Makefile").write_text("test:\n\techo ok")
        tools = ToolRegistry(config, managers.project)
        with patch.object(managers.project, "run_command") as mock_run:
            mock_run.return_value = MagicMock(stdout="ok", stderr="")
            tools.run_tests()
            assert mock_run.call_args[0][0][0] == "make"

    def test_run_tests_direct_fallback(
        self, config: Config, managers: ManagerRegistry
    ) -> None:
        tools = ToolRegistry(config, managers.project)
        with patch.object(managers.project, "run_command") as mock_run:
            mock_run.return_value = MagicMock(stdout="ok", stderr="")
            tools.run_tests()
            assert mock_run.call_args[0][0][0] == "python"

    def test_write_file(self, config: Config, managers: ManagerRegistry) -> None:
        tools = ToolRegistry(config, managers.project)
        result = tools.write_file("test.txt", "hello")
        assert "Written test.txt" in result
        assert (config.PROJECT_DIR / "test.txt").read_text() == "hello"

    def test_read_file(self, config: Config, managers: ManagerRegistry) -> None:
        (config.PROJECT_DIR / "test.txt").write_text("hello")
        tools = ToolRegistry(config, managers.project)
        result = tools.read_file("test.txt")
        assert result == "hello"


class TestSkillsManager:
    def test_find_skills_when_npx_missing(self, config: Config) -> None:
        sm = SkillsManager(config)
        with patch("spiral.managers.skills.shutil.which") as mock_which:
            mock_which.return_value = None
            skills = sm.find_skills("task")
        assert skills == []

    def test_add_skill_when_npx_missing(self, config: Config) -> None:
        sm = SkillsManager(config)
        with patch("spiral.managers.skills.shutil.which") as mock_which:
            mock_which.return_value = None
            ok = sm.add_skill("https://github.com/x/y", "skill-name")
        assert ok is False

    def test_ensure_skill(self, config: Config) -> None:
        sm = SkillsManager(config)
        with patch.object(sm, "add_skill") as mock_add:
            mock_add.return_value = True
            ok = sm.ensure_skill("skill-name", "https://github.com/x/y")
        assert ok is True


class TestProjectManager:
    def test_mark_adr_done_with_existing_status(self, config: Config) -> None:
        config.ADR_PATH.write_text("# ADR\n## Section 1\n**Status:** Pending\ncontent")
        pm = ProjectManager(config)
        pm.mark_adr_done("Section 1")
        adr = config.ADR_PATH.read_text()
        assert "**Status:** Done" in adr

    def test_mark_adr_done_without_status(self, config: Config) -> None:
        config.ADR_PATH.write_text("# ADR\n## Section 1\ncontent")
        pm = ProjectManager(config)
        pm.mark_adr_done("Section 1")
        adr = config.ADR_PATH.read_text()
        assert "**Status:** Done" in adr

    def test_append_adr_section(self, config: Config) -> None:
        config.ADR_PATH.write_text("# ADR\n## Section 1\ncontent")
        pm = ProjectManager(config)
        pm.append_adr_section("Section 2", "new description")
        adr = config.ADR_PATH.read_text()
        assert "## Section 2" in adr
        assert "new description" in adr
        assert "**Status:** Pending" in adr

    def test_get_adr_section_names(self, config: Config) -> None:
        config.ADR_PATH.write_text("# ADR\n## Section 1\ncontent\n## Section 2\nmore")
        pm = ProjectManager(config)
        sections = pm.get_adr_section_names()
        assert sections == ["Section 1", "Section 2"]


class TestLLMClient:
    def test_chat(self, config: Config) -> None:
        with patch("httpx.Client") as mock_client_cls:
            mock_client = MagicMock()
            mock_client_cls.return_value.__enter__ = MagicMock(
                return_value=(mock_client)
            )
            mock_client_cls.return_value.__exit__ = MagicMock(return_value=False)
            mock_resp = MagicMock()
            mock_resp.json.return_value = {"message": {"content": "hi"}}
            mock_client.post.return_value = mock_resp
            llm = LLMClient(config)
            result = llm.chat([{"role": "user", "content": "hello"}])
            assert result["message"]["content"] == "hi"

    def test_generate(self, config: Config) -> None:
        with patch("httpx.Client") as mock_client_cls:
            mock_client = MagicMock()
            mock_client_cls.return_value.__enter__ = MagicMock(
                return_value=(mock_client)
            )
            mock_client_cls.return_value.__exit__ = MagicMock(return_value=False)
            mock_resp = MagicMock()
            mock_resp.json.return_value = {"response": "generated"}
            mock_client.post.return_value = mock_resp
            llm = LLMClient(config)
            result = llm.generate("prompt")
            assert result == "generated"

    def test_extract_json_array(self, config: Config) -> None:
        llm = LLMClient(config)
        result = llm.extract_json('prefix [{"a": 1}] suffix')
        assert result == [{"a": 1}]

    def test_extract_json_object(self, config: Config) -> None:
        llm = LLMClient(config)
        result = llm.extract_json('prefix {"a": 1} suffix')
        assert result == {"a": 1}

    def test_extract_json_invalid(self, config: Config) -> None:
        llm = LLMClient(config)
        result = llm.extract_json("no json here")
        assert result is None


class TestMain:
    def test_main_reset(self, config: Config, tmp_path: Path) -> None:
        project_dir = tmp_path / "project"
        project_dir.mkdir(parents=True, exist_ok=True)
        adr_path = project_dir / "docs" / "adr" / "001-architecture.md"
        adr_path.parent.mkdir(parents=True, exist_ok=True)
        (project_dir / "AGENTS.md").write_text("# Agents")
        adr_path.write_text("# ADR\n## Section 1\ncontent")
        from spiral.main import main

        with patch(
            "sys.argv", ["spiral", "--mode", "reset", "--project-dir", str(project_dir)]
        ):
            main()

    def test_main_init(self, config: Config, tmp_path: Path) -> None:
        project_dir = tmp_path / "project"
        project_dir.mkdir(parents=True, exist_ok=True)
        adr_path = project_dir / "docs" / "adr" / "001-architecture.md"
        adr_path.parent.mkdir(parents=True, exist_ok=True)
        adr_path.write_text("# ADR\n## Section 1\ncontent")
        (project_dir / "AGENTS.md").write_text("# Agents")
        from spiral.main import main

        with (
            patch(
                "sys.argv",
                ["spiral", "--mode", "init", "--project-dir", str(project_dir)],
            ),
            patch("spiral.llm.LLMClient.generate") as mock_gen,
        ):
            mock_gen.return_value = (
                '[{"name": "f1", "description": "test", "adr_section": "Section 1"}]'
            )
            main()
        assert (project_dir / "AGENTS.md").exists()


class TestHarness:
    def test_initialize_resumes(self, config: Config) -> None:
        config.ADR_PATH.write_text("# ADR\n## Section 1\ncontent")
        config.AGENTS_PATH.write_text("# Agents")
        with (
            patch("spiral.llm.LLMClient.generate") as mock_gen,
            patch("spiral.llm.LLMClient.extract_json") as mock_extract,
        ):
            mock_gen.return_value = (
                '[{"name": "f1", "description": "test", "adr_section": "Section 1"}]'
            )
            mock_extract.return_value = [
                {"name": "f1", "description": "test", "adr_section": "Section 1"}
            ]
            harness = Harness(config)
            harness.initialize()
        assert harness.state is not None
        # Second initialize should resume
        harness.initialize()
        assert harness.state is not None

    def test_run_single_feature(self, config: Config) -> None:
        config.ADR_PATH.write_text("# ADR\n## Section 1\ncontent")
        config.AGENTS_PATH.write_text("# Agents")
        harness = Harness(config)
        state = HarnessState()
        state.features = [Feature(name="f1", adr_section="Section 1")]
        state.system_prompt = "prompt"
        harness.managers.state.save(state)
        with (
            patch.object(harness.agent, "run", return_value="output"),
            patch.object(
                harness.verifier, "run", return_value=(True, MagicMock(score=0.95))
            ),
            patch.object(harness.engine, "analyze", return_value=[]),
            patch.object(
                harness.event_driver, "has_more_work", side_effect=[True, False]
            ),
            patch.object(
                harness.event_driver,
                "get_next_feature",
                return_value=Feature(name="f1", adr_section="Section 1"),
            ),
        ):
            harness.run()
        assert harness.state is not None

    def test_run_forever_cycle(self, config: Config) -> None:
        config.ADR_PATH.write_text("# ADR\n## Section 1\ncontent")
        config.AGENTS_PATH.write_text("# Agents")
        harness = Harness(config)
        state = HarnessState()
        state.features = [Feature(name="f1", adr_section="Section 1")]
        state.system_prompt = "prompt"
        harness.managers.state.save(state)

        def _has_more_work(_state: HarnessState) -> bool:
            _has_more_work.calls = getattr(_has_more_work, "calls", 0) + 1
            if _has_more_work.calls > 8:
                raise RuntimeError("test exit")
            return _has_more_work.calls % 2 == 1

        with (
            patch.object(harness, "_process_next_feature") as mock_proc,
            patch.object(harness.engine, "analyze", return_value=[]),
            patch.object(
                harness.event_driver, "has_more_work", side_effect=_has_more_work
            ),
            patch.object(
                harness.event_driver, "generate_events_from_adr", return_value=[]
            ),
            pytest.raises(RuntimeError, match="test exit"),
        ):
            harness.run_forever()
        assert harness.state is not None
        assert mock_proc.call_count >= 1


class TestSkillsManagerParsing:
    def test_parse_skills_output_json(self, config: Config) -> None:
        sm = SkillsManager(config)
        output = '["skill-a", "skill-b"]'
        skills = sm._parse_skills_output(output, "task")
        assert "skill-a" in skills
        assert "skill-b" in skills

    def test_parse_skills_output_backticks(self, config: Config) -> None:
        sm = SkillsManager(config)
        output = "Use `skill-a` or `skill-b`"
        skills = sm._parse_skills_output(output, "task")
        assert "skill-a" in skills
        assert "skill-b" in skills
