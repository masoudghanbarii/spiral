from __future__ import annotations

import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from spiral.config import Config
from spiral.managers.git import GitManager
from spiral.managers.project import ProjectManager
from spiral.providers import (
    AnthropicProvider,
    OllamaProvider,
    OpenAIProvider,
    create_provider,
)
from spiral.tools.registry import ToolRegistry


@pytest.fixture
def config(tmp_path: Path) -> Config:
    c = Config()
    c.SPIRAL_DIR = tmp_path / "spiral"
    c.TRACES_DIR = tmp_path / "spiral" / "traces"
    c.STATE_FILE = tmp_path / "spiral" / "state.json"
    c.STATUS_FILE = tmp_path / "spiral" / "status.json"
    c.SKILLS_DIR = tmp_path / "spiral" / "skills"
    c.PROJECT_DIR = tmp_path / "project"
    c.PROJECT_DIR.mkdir(parents=True, exist_ok=True)
    c.ADR_PATH = c.PROJECT_DIR / "docs" / "adr" / "001-architecture.md"
    c.ADR_PATH.parent.mkdir(parents=True, exist_ok=True)
    c.AGENTS_PATH = c.PROJECT_DIR / "AGENTS.md"
    return c


class TestGitManager:
    def test_status(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(
                stdout=" M file.py\n", stderr="", returncode=0
            )
            result = gm.status()
        assert "file.py" in result

    def test_diff_staged(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(
                stdout="diff content", stderr="", returncode=0
            )
            result = gm.diff(staged=True)
        assert "diff content" in result
        args = mock_run.call_args[0][0]
        assert "git" in args
        assert "diff" in args
        assert "--staged" in args

    def test_diff_unstaged(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(stdout="diff", stderr="", returncode=0)
            gm.diff(staged=False)
        args = mock_run.call_args[0][0]
        assert "--staged" not in args

    def test_add_specific_paths(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(stdout="", stderr="", returncode=0)
            gm.add(paths=["file1.py", "file2.py"])
        args = mock_run.call_args[0][0]
        assert "add" in args
        assert "file1.py" in args
        assert "file2.py" in args

    def test_add_all(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(stdout="", stderr="", returncode=0)
            gm.add()
        args = mock_run.call_args[0][0]
        assert "." in args

    def test_commit(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(
                stdout="[main abc1234] msg", stderr="", returncode=0
            )
            result = gm.commit("test message")
        assert "msg" in result
        args = mock_run.call_args[0][0]
        assert "commit" in args
        assert "-m" in args
        assert "test message" in args

    def test_branch_list(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(
                stdout="* main\n  dev\n", stderr="", returncode=0
            )
            result = gm.branch()
        assert "main" in result
        assert "dev" in result

    def test_branch_create(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(stdout="", stderr="", returncode=0)
            gm.branch(action="create", name="feature-x")
        args = mock_run.call_args[0][0]
        assert "branch" in args
        assert "feature-x" in args

    def test_branch_switch(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(stdout="", stderr="", returncode=0)
            gm.branch(action="switch", name="dev")
        args = mock_run.call_args[0][0]
        assert "switch" in args
        assert "dev" in args

    def test_log(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(
                stdout="abc1234 first commit\ndef5678 second\n",
                stderr="",
                returncode=0,
            )
            result = gm.log(limit=5)
        assert "abc1234" in result
        args = mock_run.call_args[0][0]
        assert "log" in args
        assert "-5" in args

    def test_is_repo_true(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(stdout="true\n", stderr="", returncode=0)
            assert gm.is_repo() is True

    def test_is_repo_false(self, config: Config) -> None:
        pm = ProjectManager(config)
        gm = GitManager(pm)
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(
                stdout="", stderr="not a repo", returncode=128
            )
            assert gm.is_repo() is False


class TestGitTools:
    def test_tool_registry_git_status(self, config: Config) -> None:
        pm = ProjectManager(config)
        tools = ToolRegistry(config, pm)
        config.AUTO_APPROVE = True
        tools.permissions.auto_approve = True
        with patch.object(pm, "run_command") as mock_run:
            mock_run.return_value = MagicMock(
                stdout=" M x.py\n", stderr="", returncode=0
            )
            result = tools.execute("git_status", {})
        assert "x.py" in result

    def test_tool_registry_git_commit_requires_permission(self, config: Config) -> None:
        pm = ProjectManager(config)
        tools = ToolRegistry(config, pm)
        config.AUTO_APPROVE = False
        tools.permissions.auto_approve = False
        result = tools.execute("git_commit", {"message": "test"})
        assert "Error" in result or "approval" in result.lower()


class TestMultiModel:
    def test_create_provider_ollama_default(self, config: Config) -> None:
        config.LLM_PROVIDER = "ollama"
        provider = create_provider(config)
        assert isinstance(provider, OllamaProvider)

    def test_create_provider_anthropic(self, config: Config) -> None:
        config.LLM_PROVIDER = "anthropic"
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}):
            provider = create_provider(config)
        assert isinstance(provider, AnthropicProvider)

    def test_create_provider_openai(self, config: Config) -> None:
        config.LLM_PROVIDER = "openai"
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}):
            provider = create_provider(config)
        assert isinstance(provider, OpenAIProvider)

    def test_create_provider_falls_back_to_ollama(self, config: Config) -> None:
        config.LLM_PROVIDER = "unknown"
        provider = create_provider(config)
        assert isinstance(provider, OllamaProvider)

    def test_anthropic_chat(self, config: Config) -> None:
        config.LLM_PROVIDER = "anthropic"
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "key"}):
            provider = AnthropicProvider(config)
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "content": [{"type": "text", "text": "hello"}]
        }
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.post.return_value = mock_response
        with patch("httpx.Client", return_value=mock_client):
            result = provider.chat([{"role": "user", "content": "hi"}])
        assert result["message"]["content"] == "hello"

    def test_openai_chat(self, config: Config) -> None:
        config.LLM_PROVIDER = "openai"
        with patch.dict(os.environ, {"OPENAI_API_KEY": "key"}):
            provider = OpenAIProvider(config)
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "hi there", "tool_calls": []}}]
        }
        mock_client = MagicMock()
        mock_client.__enter__ = MagicMock(return_value=mock_client)
        mock_client.__exit__ = MagicMock(return_value=False)
        mock_client.post.return_value = mock_response
        with patch("httpx.Client", return_value=mock_client):
            result = provider.chat([{"role": "user", "content": "hi"}])
        assert result["message"]["content"] == "hi there"
