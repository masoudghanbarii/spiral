# ADR: Spiral Harness Evolution

**Status:** In Progress

## Context

Spiral has a novel 4-loop hill climbing architecture (agent → verifier → event → engine) but the agent layer lacks production coding agent capabilities. This ADR defines the features needed to bridge the gap between Spiral and mature coding harnesses like opencode and Claude Code.

## Decision

Implement the following features in dependency order. Each feature is self-contained, testable, and ships independently.

---

## Patch-Based File Editing

**Status:** Done

Replace full-file rewrite with surgical edits. Add `edit_file` tool that accepts `old_string` and `new_string` parameters. The tool finds the exact `old_string` in the file and replaces it with `new_string`. Support `replaceAll` flag for multi-occurrence replacement. Error if `old_string` not found or found multiple times without `replaceAll`. This reduces token usage by 10-100x for large files and prevents context loss during edits.

Requirements:
- `edit_file(path, old_string, new_string, replaceAll=False)` tool
- Error on old_string not found
- Error on multiple matches without replaceAll
- Preserve exact indentation
- Return diff preview of what changed
- Integrate into ToolRegistry and agent tool definitions

---

## Search Tools (grep + glob)

**Status:** Done

Add `grep` and `glob` tools for codebase navigation. `grep` searches file contents using ripgrep (or fallback to Python re). `glob` finds files by name pattern. Both return matched file paths + line numbers + matched lines. These tools let the agent find code without reading entire files.

Requirements:
- `grep(pattern, include="*.py", path=None)` tool — returns file:line:content matches
- `glob(pattern, path=None)` tool — returns matching file paths
- Use `rg` if available, fallback to Python re module
- Limit results to 100 matches
- Include line numbers in grep output

---

## Read File with Offset/Limit

**Status:** Done

Enhance `read_file` tool with optional `offset` (line number to start from, 1-indexed) and `limit` (max lines to read) parameters. Default: read entire file. This lets the agent read specific sections of large files without consuming the full content in the context window.

Requirements:
- `read_file(path, offset=None, limit=None)` — offset is 1-indexed line number
- Return line numbers prefixed (e.g., `42: content`)
- Error if file doesn't exist
- Support reading image files (return path + size info)
- Truncate lines longer than 2000 characters

---

## Permission System

**Status:** Done

Add a tool permission layer. Destructive tools (`write_file`, `edit_file`, `run_command`, `mark_adr_done`) require approval before execution. Non-destructive tools (`read_file`, `grep`, `glob`, `list_files`, `read_adr`, `read_agents_md`, `find_skills`) execute freely. Support auto-deny patterns for dangerous commands (`rm -rf`, `git push --force`, `sudo`). Support `SPIRAL_AUTO_APPROVE` env var for autonomous mode.

Requirements:
- `PermissionLevel` enum: AUTO, APPROVE, DENY
- Per-tool permission config in `tool_config` state
- `PermissionManager` class — checks tool + args before execution
- Auto-deny patterns: `rm -rf`, `git push --force`, `sudo`, `chmod 777`, `dd of=`
- `SPIRAL_AUTO_APPROVE` env var (default false) — skips all approval checks
- `run_command` checks command string against deny patterns
- `write_file` / `edit_file` check path against protected paths config
- Log all permission decisions to traces

---

## Context Window Management

**Status:** Done

Track token usage in agent message history. When approaching the context window limit, compact older messages by summarizing them into a single system message. Use a lightweight token estimator (word count * 1.3 as approximation, or tiktoken if available).

Requirements:
- `TokenCounter` class — estimate tokens from string/message list
- `ContextManager` class — track token count, trigger compaction at threshold
- Config: `SPIRAL_CONTEXT_WINDOW_TOKENS` (default 32768), `SPIRAL_COMPACTION_THRESHOLD` (default 0.8)
- Compaction: summarize messages[1:-4] into single system message, keep last 4 messages
- Summarization via LLM generate() call
- Log compaction events to traces
- Display token usage in watch dashboard

---

## Streaming LLM Responses

**Status:** Done

Switch LLM client from blocking to streaming. Use httpx streaming with SSE parsing for Ollama API. Emit partial tokens to a callback. Watch dashboard shows live token output. Agent loop processes tool calls from accumulated stream.

Requirements:
- `LLMClient.chat_stream()` method — async generator yielding token chunks
- Parse Ollama streaming format (newline-delimited JSON)
- Callback for token emission (watch dashboard subscribes)
- Fallback to blocking if streaming fails
- `stream: True` in Ollama API payload
- Watch dashboard shows partial response in real-time

---

## Git Integration Tools

**Status:** Done

Add git tools so Spiral can ship what it builds. `git_status`, `git_diff`, `git_add`, `git_commit`, `git_branch`, `git_log`. All execute via subprocess in the project directory.

Requirements:
- `git_status()` — return staged/unstaged/untracked file list
- `git_diff(staged=True)` — return diff output
- `git_add(paths)` — stage files
- `git_commit(message)` — commit staged changes
- `git_branch(action, name)` — list/create/switch branches
- `git_log(limit=10)` — return recent commit hashes + messages
- All git commands run via `ProjectManager.run_command`
- Protected: `git push` requires approval (permission system)

---

## Multi-Model LLM Support

**Status:** Done

Abstract LLM client behind a protocol. Add support for Anthropic Claude, OpenAI, and local Ollama. User configures provider via `SPIRAL_LLM_PROVIDER` env var. Each provider implements `chat()`, `generate()`, and `stream()` methods.

Requirements:
- `LLMProvider` protocol — `chat()`, `generate()`, `stream()`
- `OllamaProvider` — existing implementation
- `AnthropicProvider` — Anthropic Messages API
- `OpenAIProvider` — OpenAI Chat Completions API
- `LLMClient` becomes factory — instantiates correct provider from config
- Config: `SPIRAL_LLM_PROVIDER` (ollama, anthropic, openai)
- Provider-specific auth via env vars (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
- `SPIRAL_MODEL` maps to provider-specific model names

---

## Session Resume with Message History

**Status:** Done

Save agent message history to disk so sessions can resume mid-feature. Currently `state.json` saves feature queue + counters but not conversation context. Add `messages` field to `HarnessState` (or separate `messages.json` file). On resume, replay messages into agent loop.

Requirements:
- Save message history after each agent run to `messages.json`
- `HarnessState.message_history` field
- On resume, load messages and continue from last state
- Config: `SPIRAL_SAVE_MESSAGES` (default true)
- Truncate tool results in saved messages to 500 chars to control file size
- Clear message history when feature completes

---

## Subagent Parallelism

**Status:** Done

Enable parallel agent execution for independent features. Use asyncio to run multiple agent loops concurrently. Shared state coordinator prevents conflicts (file writes, git operations). Engine loop can spawn subagents for trace analysis while main agent works.

Requirements:
- `asyncio`-based agent loop (async `run()`)
- `SubagentManager` — spawns + tracks concurrent agent loops
- Config: `SPIRAL_MAX_CONCURRENT_AGENTS` (default 1)
- Shared state lock for file operations
- Features with no file overlap can run in parallel
- Subagents report results to main harness
- Watch dashboard shows active subagent count

---

## MCP Client (Tool Extensibility)

**Status:** Done

Implement Model Context Protocol client so users can extend Spiral's tools without modifying harness code. Connect to MCP servers via stdio or HTTP. Dynamically register MCP tools into ToolRegistry.

Requirements:
- `MCPClient` class — connects to MCP server (stdio or HTTP transport)
- `MCPClient.list_tools()` — discover tools from server
- `MCPClient.call_tool(name, args)` — invoke MCP tool
- Config: `SPIRAL_MCP_SERVERS` — JSON list of server configs
- Auto-register MCP tools into ToolRegistry on harness init
- MCP tool definitions merged with built-in tool definitions
- Log MCP tool calls to traces

---

## Interactive Mode

**Status:** Done

Allow user to interject during agent execution. stdin listener thread polls for input. User messages injected into agent conversation. Supports redirecting the agent, asking questions, or providing clarifications mid-feature.

Requirements:
- `InteractiveMode` class — stdin listener on background thread
- Config: `SPIRAL_INTERACTIVE` (default false)
- User input injected as `{"role": "user", "content": input}` message
- Agent sees user message on next iteration
- Watch dashboard shows "user interjection" event
- Commands: `/pause`, `/resume`, `/redirect <feature>`, `/stop`
- Graceful shutdown on Ctrl+C

---

## Hierarchical Memory Management with Multi-Session Support

**Status:** Done

OpenClaw-style memory management within each session, plus multi-session support. Three layers: project (shared, persistent), session (isolated, parallel-safe), feature (scoped, ephemeral). Each layer can read parent but not siblings.

### Project-Level Memory (persistent, shared across all sessions)

Stores learned facts, conventions, failure patterns, and agent preferences. Survives across all sessions and restarts. All sessions read/write this layer.

Requirements:
- `memory/project/facts.json` — learned conventions (e.g., "project uses FastAPI + async SQLAlchemy")
- `memory/project/failures.json` — recurring failure patterns to avoid
- `memory/project/preferences.json` — agent behavior preferences tuned by engine loop
- Engine analysis loop writes improvements here (replaces state.harness_improvements)
- All sessions read this on startup, inject into system prompt
- Write requires atomic write (tmp + os.replace) for concurrent access

### Session-Level Memory (isolated, parallel-safe, OpenClaw-style within session)

Each session gets isolated memory. Multiple sessions can run in parallel without conflict. Within a session, memory management follows OpenClaw patterns: conversation history, context window tracking, compaction, and state persistence.

Requirements:
- `memory/sessions/<session_id>/messages.json` — full conversation history (OpenClaw-style continuous message log)
- `memory/sessions/<session_id>/state.json` — feature queue + progress
- `memory/sessions/<session_id>/context.json` — session metadata (mode, start time, model, token usage)
- `memory/sessions/<session_id>/summary.json` — running compaction summary (like OpenClaw's compressed context)
- Session ID auto-generated (timestamp + uuid) or user-specified via `--session-id`
- Multiple sessions coexist: `spiral --mode run --session-id auth-feature` + `spiral --mode run --session-id db-schema`
- Session resume loads messages + state from this layer
- OpenClaw pattern: messages accumulate, compaction summarizes older messages into summary.json, agent sees system + summary + recent messages
- `spiral --mode sessions` lists all sessions with status (running/completed/failed) and progress

### Feature-Level Memory (scoped, ephemeral)

Each feature within a session gets isolated memory. Agent working on feature A can't see feature B's memory. Archived when feature completes.

Requirements:
- `memory/sessions/<session_id>/features/<feature_name>/agent_messages.json` — ReAct message history for this feature
- `memory/sessions/<session_id>/features/<feature_name>/verification.json` — grading results + feedback
- `memory/sessions/<session_id>/features/<feature_name>/tool_history.json` — tool call sequence
- Feature memory archived to `memory/sessions/<session_id>/features/_archive/` on completion
- Agent can only access current feature's memory layer

### Memory Manager

Requirements:
- `MemoryManager` class — coordinates all three layers
- `memory.project.get_facts()` / `memory.project.add_fact(key, value)`
- `memory.session.get_messages()` / `memory.session.save_messages(msgs)` / `memory.session.get_summary()` / `memory.session.update_summary(text)`
- `memory.feature.get_context(feature_name)` / `memory.feature.save_context(name, data)` / `memory.feature.archive(feature_name)`
- Scoped access: feature reads project + session + own; session reads project + own; project reads own only
- Atomic writes (tmp + os.replace) for concurrent safety
- Memory compaction at session level (existing ContextManager integrates here — writes summary.json)
- Watch dashboard shows memory size per layer + active session count
- Config: `SPIRAL_MEMORY_DIR` (default: `<spiral_dir>/memory`)
- `spiral --mode sessions` — list all sessions with metadata
- `spiral --mode watch` — shows current/selected session memory stats

---

## Agent Behavior Modes

**Status:** Done

Five behavioral modes that modify how the agent operates. Layered on top of execution modes (run/forever/init/reset/watch) via `--behavior` flag.

### Plan Mode (`--behavior plan`)

Agent reads, searches, and thinks but cannot modify anything. No file writes, no command execution, no git operations. Agent outputs an implementation plan instead of code. Useful for reviewing ADR feasibility before committing to a run.

Requirements:
- Disable all destructive tools: write_file, edit_file, run_command, mark_adr_done, git_add, git_commit, git_branch
- Agent system prompt updated: "You are in PLAN MODE. Do not write or modify files. Output a detailed implementation plan."
- Allowed tools: read_file, grep, glob, list_files, read_adr, read_agents_md, find_skills, run_tests, run_lint
- Output: structured plan (files to create/modify, approach, risks)
- Plan saved to `memory/sessions/<session>/plan.json`

### Bypass Permissions Mode (`--behavior bypass`)

Skip all permission checks. Auto-approve everything including dangerous commands. For trusted autonomous runs.

Requirements:
- Set `AUTO_APPROVE = True` in config
- PermissionManager returns AUTO for all tools
- No deny patterns enforced
- Log to traces: "bypass mode active"
- Watch dashboard shows "BYPASS" warning

### Interactive Mode (`--behavior interactive`)

User can interject during agent execution. stdin listener thread. User messages injected into agent conversation.

Requirements:
- stdin listener on background thread (non-blocking)
- User input injected as `{"role": "user", "content": input}` message
- Agent sees user message on next iteration
- Commands: `/pause`, `/resume`, `/redirect <feature>`, `/stop`, `/plan`, `/bypass`
- Watch dashboard shows "user interjection" event
- Graceful shutdown on Ctrl+C
- Mode can switch at runtime via commands

### Normal Mode (`--behavior normal`, default)

Ask approval for destructive tools. Read-only tools execute freely. Standard operation.

Requirements:
- PermissionManager checks destructive tools against deny patterns + protected paths
- Destructive tools on non-protected paths require approval (if not auto-approve)
- This is existing behavior, just named explicitly

### Safe Mode (`--behavior safe`)

Read-only. No modifications whatsoever. For inspection and analysis runs.

Requirements:
- Disable ALL destructive tools + run_tests + run_lint (they execute code)
- Only allowed: read_file, grep, glob, list_files, read_adr, read_agents_md, find_skills
- Agent system prompt: "You are in SAFE MODE. Read-only access. Analyze and report."
- Watch dashboard shows "SAFE" indicator

---

## Summary

Total: 11 features. Implementation order follows dependency graph:

1. **Batch 1 (critical path)**: edit_file, grep, glob, read_file offset/limit, permissions
2. **Batch 2 (capability)**: context management, streaming, compaction
3. **Batch 3 (integration)**: git tools, multi-model
4. **Batch 4 (advanced)**: session resume, subagents, MCP, interactive

Each feature ships independently with tests and lint clean.
