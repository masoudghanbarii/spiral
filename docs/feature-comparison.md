# Agent Harness Feature Comparison

Comparison of 4 agent harnesses: **opencode**, **openclaw**, **oh-my-pi**, and **spiral**.

- ☑️ = feature available
- ➖ = not available
- 🔶 = partial / experimental

---

## 1. CLI Commands

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Interactive TUI (default no-args) | ☑️ | ☑️ | ☑️ | ☑️ |
| One-shot run (`run [message]`) | ☑️ | ☑️ (`agent exec`) | ☑️ (`--print`) | ☑️ (`spiral run`) |
| Autonomous batch mode | ☑️ | ➖ | ➖ | ☑️ (`spiral run`) |
| Forever/continuous loop | ➖ | ➖ | ➖ | ☑️ (`spiral forever`) |
| Init from ADR | ➖ | ➖ | ➖ | ☑️ (`spiral init`) |
| Reset state | ☑️ (`uninstall`) | ☑️ | ☑️ (`gc`) | ☑️ (`spiral reset`) |
| Session list/delete | ☑️ | ☑️ | ☑️ | ☑️ (`spiral sessions`) |
| Watch/live dashboard | ➖ | ☑️ (`dashboard`) | ☑️ (`stats`) | ☑️ (`spiral watch`) |
| Serve/headless HTTP | ☑️ (`serve`) | ☑️ (`gateway run`) | ☑️ (`rpc`) | ➖ |
| Web UI | ☑️ (`web`) | ☑️ (Control UI) | ☑️ (`rpc-ui`) | ➖ |
| Attach to running server | ☑️ (`attach`) | ☑️ | ➖ | ➖ |
| ACP server mode | ☑️ (`acp`) | ☑️ | ☑️ (`acp`) | ➖ |
| Model listing | ☑️ (`models`) | ☑️ (`models list`) | ☑️ (`models`) | ➖ |
| Provider auth/login | ☑️ (`providers login`) | ☑️ | ☑️ (`/login`) | ➖ |
| Stats/cost report | ☑️ (`stats`) | ☑️ (`usage-cost`) | ☑️ (`stats`, `usage`) | ➖ |
| Plugin install/manage | ☑️ (`plugin`) | ☑️ (`plugins`) | ☑️ (`plugin`) | ➖ |
| MCP server manage | ☑️ (`mcp add/list/auth`) | ☑️ (`mcp serve/add/...`) | ☑️ (`/mcp`) | ➖ |
| Agent create/manage | ☑️ (`agent create`) | ☑️ (`agents`) | ☑️ (`agents unpack`) | ➖ |
| Session export/import | ☑️ (`export`, `import`) | ☑️ (`export-trajectory`) | ☑️ (`share`) | ➖ |
| Self-upgrade | ☑️ (`upgrade`) | ☑️ (`update`) | ☑️ (`update`) | ➖ |
| Shell completion | ☑️ | ☑️ (`completion`) | ☑️ (`completions`) | ➖ |
| Debug/diagnostics | ☑️ (`debug`) | ☑️ (`doctor`) | ☑️ (`debug`) | ➖ |
| Config inspect/edit | ☑️ | ☑️ (`config get/set`) | ☑️ (`config`) | ☑️ (env vars) |
| Git PR checkout + run | ☑️ (`pr`) | ➖ | ☑️ (`gh-pr-checkout`) | ➖ |
| GitHub bot mode | ☑️ (`github`) | ➖ | ➖ | ➖ |
| Cron/automations | ➖ | ☑️ (`cron`) | ➖ | ➖ |
| Backup/restore | ➖ | ☑️ (`backup`) | ☑️ (`gc`) | ➖ |
| Fleet/multi-tenant | ➖ | ☑️ (`fleet`) | ➖ | ➖ |
| Doctor/repair | ☑️ (`debug`) | ☑️ (`doctor --fix`) | ☑️ (`doctor`) | ➖ |
| DB query shell | ☑️ (`db`) | ➖ | ➖ | ➖ |

## 2. Agent Modes

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Normal (ask approval) | ☑️ | ☑️ | ☑️ | ☑️ |
| Plan mode (read-only) | ☑️ (experimental) | ➖ | ☑️ (`--plan`) | ☑️ (`--behavior plan`) |
| Bypass permissions | ☑️ (`--yolo`) | ☑️ (`bypassPermissions`) | ☑️ (`--yolo`) | ☑️ (`--behavior bypass`) |
| Safe mode (read-only) | ➖ | ➖ | ➖ | ☑️ (`--behavior safe`) |
| Interactive mode | ☑️ (TUI) | ☑️ (TUI) | ☑️ (TUI) | ☑️ (`--behavior interactive`) |
| Custom agents | ☑️ (`agent create`) | ☑️ (agent config) | ☑️ (agent plugins) | ➖ |
| Subagent types | ☑️ (explore, general) | ☑️ (subagent spawn) | ☑️ (scout, designer, reviewer, etc.) | ➖ |
| Goal mode | ➖ | ☑️ (`goal` tool) | ☑️ (`/goal`) | ➖ |
| Prewalk mode | ➖ | ➖ | ☑️ (`--prewalk`) | ➖ |
| Live/voice mode | ➖ | ➖ | ☑️ (Codex live) | ➖ |
| Cleanse/diagnostic loop | ➖ | ➖ | ☑️ (`omp cleanse`) | ➖ |
| Vibe mode (worker session) | ➖ | ➖ | ☑️ (`/vibe`) | ➖ |

## 3. Tools

| Tool | opencode | openclaw | oh-my-pi | spiral |
|------|:--------:|:--------:|:-------:|:------:|
| read_file (with offset/limit) | ☑️ | ☑️ | ☑️ | ☑️ |
| write_file | ☑️ | ☑️ | ☑️ | ☑️ |
| edit_file (search/replace) | ☑️ | ☑️ | ☑️ | ☑️ |
| apply_patch | ☑️ (GPT-5 models) | ☑️ | ☑️ (apply_patch mode) | ➖ |
| grep (ripgrep) | ☑️ | ☑️ | ☑️ (native Rust) | ☑️ |
| glob | ☑️ | ☑️ | ☑️ (native Rust) | ☑️ |
| bash/shell | ☑️ (tree-sitter parsed) | ☑️ (brush shell) | ☑️ (embedded brush) | ☑️ (`run_command`) |
| run_tests | ➖ | ➖ | ➖ | ☑️ |
| run_lint | ➖ | ➖ | ➖ | ☑️ |
| list_files | ☑️ (`ls`) | ☑️ (`ls`) | ☑️ | ☑️ |
| read_adr | ➖ | ➖ | ➖ | ☑️ |
| mark_adr_done | ➖ | ➖ | ➖ | ☑️ |
| find_skills | ☑️ (`skill`) | ☑️ (`skills search`) | ☑️ (`learn`) | ➖ |
| webfetch | ☑️ | ☑️ (`web_fetch`) | ☑️ (`fetch`) | ➖ |
| websearch | ☑️ (Exa/Parallel) | ☑️ (Brave/Exa/Tavily/etc.) | ☑️ (20+ providers) | ➖ |
| task (subagent spawn) | ☑️ | ☑️ (`subagents`) | ☑️ (`task`) | ➖ |
| todo | ☑️ | ➖ | ☑️ (`todo`) | ➖ |
| question (ask user) | ☑️ | ☑️ (`ask_user`) | ☑️ (`ask`) | ➖ |
| lsp | ☑️ (experimental) | ➖ | ☑️ | ➖ |
| browser automation | ➖ | ☑️ (`browser`) | ☑️ (`browser`) | ➖ |
| computer use | ➖ | ☑️ (`computer`) | ☑️ (`computer`) | ➖ |
| image generation | ➖ | ☑️ | ☑️ (`image_gen`) | ➖ |
| image inspection | ☑️ (read) | ☑️ | ☑️ (`inspect_image`) | ➖ |
| eval (code execution) | ☑️ (`execute` codemode) | ➖ | ☑️ (`eval` py/js/rb/jl) | ➖ |
| debug (DAP) | ➖ | ➖ | ☑️ (`debug`) | ➖ |
| memory edit/recall | ➖ | ➖ | ☑️ (`memory_edit`, `recall`) | ➖ |
| git_status | ☑️ (git service) | ➖ (via bash) | ➖ (via bash) | ☑️ |
| git_diff | ☑️ | ➖ | ➖ | ☑️ |
| git_add | ☑️ | ➖ | ➖ | ☑️ |
| git_commit | ☑️ | ➖ | ☑️ (`omp commit`) | ☑️ |
| git_branch | ☑️ | ➖ | ➖ | ☑️ |
| git_log | ☑️ | ➖ | ➖ | ☑️ |
| ast_grep | ➖ | ➖ | ☑️ (native Rust) | ➖ |
| ast_edit | ➖ | ➖ | ☑️ | ➖ |
| checkpoint/rewind | ➖ | ➖ | ☑️ | ➖ |
| security_scan | ➖ | ➖ | ☑️ | ➖ |
| music/video generation | ➖ | ☑️ | ➖ | ➖ |
| TTS | ➖ | ☑️ | ☑️ (`say`) | ➖ |
| PDF extraction | ➖ | ☑️ (`pdf`) | ☑️ (read PDF) | ➖ |

## 4. LLM Providers

| Provider | opencode | openclaw | oh-my-pi | spiral |
|----------|:--------:|:--------:|:-------:|:------:|
| Anthropic | ☑️ | ☑️ | ☑️ | ☑️ |
| OpenAI | ☑️ | ☑️ | ☑️ | ☑️ |
| Ollama (local) | ☑️ | ☑️ | ☑️ | ☑️ |
| Google Gemini | ☑️ | ☑️ | ☑️ | ➖ |
| Azure OpenAI | ☑️ | ☑️ | ☑️ | ➖ |
| AWS Bedrock | ☑️ | ☑️ | ☑️ | ➖ |
| xAI (Grok) | ☑️ | ☑️ | ☑️ | ➖ |
| Mistral | ☑️ | ☑️ | ☑️ | ➖ |
| Groq | ☑️ | ☑️ | ☑️ | ➖ |
| Cohere | ☑️ | ☑️ | ➖ | ➖ |
| Together | ☑️ | ☑️ | ☑️ | ➖ |
| Perplexity | ☑️ | ☑️ | ☑️ | ➖ |
| DeepSeek | ➖ | ☑️ | ☑️ | ➖ |
| OpenRouter | ☑️ | ☑️ | ☑️ | ➖ |
| HuggingFace | ➖ | ☑️ | ☑️ | ➖ |
| GitHub Copilot | ☑️ | ☑️ | ☑️ | ➖ |
| Cloudflare | ☑️ | ☑️ | ☑️ | ➖ |
| Snowflake Cortex | ☑️ | ➖ | ➖ | ➖ |
| Alibaba/Qwen | ☑️ | ☑️ | ☑️ | ➖ |
| Moonshot/Kimi | ➖ | ➖ | ☑️ | ➖ |
| Total providers | ~25 | ~60+ | ~75+ | 3 |

## 5. Memory / Context Management

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Context window tracking | ☑️ | ☑️ | ☑️ (native tokens) | ☑️ (TokenCounter) |
| Auto-compaction | ☑️ | ☑️ | ☑️ (multiple strategies) | ☑️ (ContextManager) |
| Snapcompact (image compaction) | ➖ | ➖ | ☑️ (native Rust) | ➖ |
| Session resume | ☑️ | ☑️ | ☑️ | 🔶 (state resume, no messages) |
| Conversation history persistence | ☑️ (SQLite) | ☑️ (SQLite) | ☑️ (SQLite) | ☑️ (session memory) |
| Embedding-based recall | ➖ | ☑️ (LanceDB) | ☑️ (Mnemopi) | ➖ |
| Episodic/graph memory | ➖ | ☑️ (memory-core) | ☑️ (episodic-graph) | ➖ |
| Dreaming/consolidation | ➖ | ☑️ | ➖ | ➖ |
| Hierarchical memory | ➖ | ➖ | ➖ | ☑️ (project/session/feature) |
| Project-level facts | ➖ | ➖ | ➖ | ☑️ |
| Failure pattern memory | ➖ | ➖ | ➖ | ☑️ |
| Token counting | ☑️ | ☑️ | ☑️ (tiktoken-rs native) | ☑️ (word*1.3 estimate) |

## 6. Permissions

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Ask before destructive ops | ☑️ | ☑️ | ☑️ | ☑️ |
| Auto-deny patterns | ☑️ (deny rules) | ☑️ (deny list) | ☑️ (deny) | ☑️ |
| Auto-approve all | ☑️ (`--yolo`) | ☑️ | ☑️ (`--yolo`) | ☑️ |
| Protected paths | ☑️ (external_dir) | ☑️ (fs policy) | ☑️ (path sandboxing) | ☑️ |
| Per-tool permission rules | ☑️ | ☑️ (tool policy) | ☑️ (approval.<tool>) | 🔶 (destructive set) |
| Approval persistence | ☑️ (saved) | ☑️ (allowlist) | ☑️ | ➖ |
| Permission hooks | ☑️ (plugin) | ☑️ (before-tool-call) | ☑️ (hooks) | ➖ |
| Subagent permission derivation | ☑️ | ☑️ | ☑️ | ➖ |

## 7. TUI / UI

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Interactive chat TUI | ☑️ (OpenTUI/SolidJS) | ☑️ (Ink-like) | ☑️ (custom diff-render) | ☑️ (Ink) |
| Streaming display | ☑️ | ☑️ | ☑️ | ☑️ |
| Tool call cards | ☑️ | ☑️ | ☑️ | ☑️ |
| Diff viewer | ☑️ | ☑️ | ☑️ | ➖ |
| Syntax highlighting | ☑️ | ☑️ | ☑️ (native Rust syntect) | ➖ |
| Themes | ☑️ | ☑️ | ☑️ | ➖ |
| Command palette | ☑️ | ➖ | ➖ | ➖ |
| Model picker | ☑️ | ☑️ | ☑️ | ➖ |
| Session picker | ☑️ | ☑️ | ☑️ | ➖ |
| Agent picker | ☑️ | ☑️ | ➖ | ➖ |
| Image rendering in terminal | ➖ | ➖ | ☑️ (sixel/kitty) | ➖ |
| Input history navigation | ☑️ | ➖ | ☑️ | ☑️ |
| Autocomplete | ☑️ | ☑️ | ☑️ | ➖ |
| Multi-line input | ☑️ | ☑️ (Shift+Enter) | ☑️ | ☑️ (Shift+Enter) |
| Web UI | ☑️ | ☑️ (Control UI) | ☑️ (rpc-ui) | ➖ |
| Desktop app | ☑️ (Electron) | ➖ | ➖ | ➖ |
| Mobile companion | ➖ | ☑️ (nodes) | ➖ | ➖ |
| Watch dashboard | ➖ | ☑️ | ☑️ (stats dashboard) | ☑️ |

## 8. Configuration

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| JSON/JSONC config file | ☑️ (`opencode.json`) | ☑️ (`openclaw.json`) | ☑️ (settings) | ➖ |
| Env vars | ☑️ (50+) | ☑️ | ☑️ (115+) | ☑️ (15+) |
| Per-project config | ☑️ (`.opencode/`) | ☑️ | ☑️ (`.omp/`) | ➖ |
| Global config | ☑️ (`~/.config/opencode/`) | ☑️ | ☑️ | ➖ |
| AGENTS.md support | ☑️ | ☑️ | ☑️ | ☑️ |
| CLAUDE.md support | ☑️ | ☑️ | ☑️ (import) | ➖ |
| Variable substitution | ☑️ (`${VAR}`) | ➖ | ☑️ | ➖ |
| Remote config | ☑️ (well-known) | ➖ | ➖ | ➖ |
| Config validation | ☑️ | ☑️ (`config validate`) | ☑️ | ➖ |
| Config migration | ☑️ | ☑️ (doctor) | ☑️ | ➖ |
| Profile support | ➖ | ☑️ (`--profile`) | ☑️ (`--profile`) | ➖ |

## 9. MCP (Model Context Protocol)

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| MCP client | ☑️ | ☑️ | ☑️ | ☑️ |
| stdio transport | ☑️ | ☑️ | ☑️ | ☑️ |
| HTTP transport | ☑️ (Streamable) | ☑️ | ☑️ | ➖ |
| SSE transport | ☑️ | ☑️ | ☑️ (deprecated) | ➖ |
| OAuth for MCP | ☑️ | ☑️ | ☑️ | ➖ |
| MCP tool auto-registration | ☑️ | ☑️ | ☑️ | ☑️ |
| MCP CLI manage | ☑️ | ☑️ | ☑️ | ➖ |
| Smithery integration | ➖ | ➖ | ☑️ | ➖ |
| MCP server (expose tools) | ➖ | ☑️ | ☑️ (mnemopi) | ➖ |

## 10. Git Integration

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| git_status | ☑️ (service) | ➖ (via bash) | ➖ (via bash) | ☑️ |
| git_diff | ☑️ | ➖ | ➖ | ☑️ |
| git_add | ☑️ | ➖ | ➖ | ☑️ |
| git_commit | ☑️ | ➖ | ☑️ (`omp commit`) | ☑️ |
| git_branch | ☑️ | ➖ | ➖ | ☑️ |
| git_log | ☑️ | ➖ | ➖ | ☑️ |
| Snapshot/restore | ☑️ (git-based) | ☑️ (snapshot) | ☑️ (checkpoint) | ➖ |
| Worktree management | ☑️ (experimental) | ☑️ (`worktrees`) | ☑️ (`omp wt`) | ➖ |
| PR checkout + run | ☑️ (`pr`) | ➖ | ☑️ (`gh-pr-checkout`) | ➖ |

## 11. Session Management

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Multi-session | ☑️ | ☑️ | ☑️ | ☑️ |
| Session list | ☑️ | ☑️ | ☑️ | ☑️ |
| Session resume | ☑️ | ☑️ | ☑️ | 🔶 (state only) |
| Session fork | ☑️ | ☑️ | ☑️ (`--fork`) | ➖ |
| Session share | ☑️ (share-next) | ☑️ | ☑️ (`omp share`) | ➖ |
| Session export | ☑️ | ☑️ | ☑️ | ➖ |
| Session import | ☑️ | ➖ | ☑️ (Claude/Codex import) | ➖ |
| Session branching | ☑️ (parentID) | ☑️ (child sessions) | ☑️ | ➖ |
| Session compaction | ☑️ | ☑️ | ☑️ | ➖ |
| Session revert | ☑️ | ➖ | ☑️ (checkpoint) | ➖ |
| Custom session ID | ➖ | ➖ | ➖ | ☑️ (`--session-id`) |
| Session metadata | ☑️ | ☑️ | ☑️ | ☑️ (context.json) |

## 12. Streaming

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| LLM response streaming | ☑️ | ☑️ | ☑️ | ☑️ |
| Tool call streaming | ☑️ (partial args) | ☑️ | ☑️ | ➖ |
| Streaming text completion hook | ☑️ (plugin) | ➖ | ➖ | ➖ |
| SSE event bridge | ☑️ | ☑️ | ➖ | ➖ |
| WebSocket events | ☑️ (experimental) | ➑️ | ➖ | ➖ |
| Voice/audio streaming | ➖ | ☑️ (TTS streaming) | ☑️ (WebRTC live) | ➖ |

## 13. Subagents / Tasks

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Spawn subagent | ☑️ (`task`) | ☑️ (`subagents`) | ☑️ (`task`) | 🔶 (SubagentManager) |
| Background tasks | ☑️ (experimental) | ☑️ (detached) | ☑️ (vibe workers) | ➖ |
| Parallel execution | 🔶 | ☑️ (swarm) | ☑️ (parallel) | 🔶 (asyncio stub) |
| Subagent types | ☑️ (explore, general) | ☑️ | ☑️ (scout, designer, reviewer) | ➖ |
| Task cancellation | ☑️ | ☑️ | ☑️ | ➖ |
| Structured output schema | ➖ | ☑️ (`structured_output`) | ☑️ (`outputSchema`) | ➖ |
| Task persistence/revive | ➖ | ➖ | ☑️ (persisted-revive) | ➖ |
| Isolation worktrees | ➖ | ➖ | ☑️ (`task.isolation`) | ➖ |

## 14. Diff / Editing

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Search/replace edit | ☑️ (cline/gemini-style) | ☑️ (exact replace) | ☑️ (hashline) | ☑️ |
| Full file write | ☑️ | ☑️ | ☑️ | ☑️ |
| V4A patch apply | ☑️ (GPT-5) | ☑️ | ☑️ (apply_patch mode) | ➖ |
| Line-anchored patches | ➖ | ➖ | ☑️ (hashline) | ➖ |
| AST-based edit | ➖ | ➖ | ☑️ (ast_edit) | ➖ |
| Diff preview | ☑️ | ☑️ | ☑️ | ➖ |
| Unified diff generation | ☑️ | ☑️ | ☑️ (native Rust) | ➖ |
| Multi-file edit | ☑️ | ☑️ | ☑️ | ☑️ (sequential) |
| Edit clipboard (cut/paste) | ➖ | ➖ | ☑️ | ➖ |
| Noop loop guard | ➖ | ➖ | ☑️ | ➖ |
| Conflict detection | ➖ | ➖ | ☑️ | ➖ |

## 15. Search

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| grep (content search) | ☑️ (ripgrep) | ☑️ | ☑️ (native ripgrep) | ☑️ |
| glob (file pattern) | ☑️ (ripgrep) | ☑️ (`find`) | ☑️ (native) | ☑️ |
| AST grep (structural) | ➖ | ➖ | ☑️ (native ast-grep) | ➖ |
| Fuzzy file find | ➖ | ➖ | ☑️ (native) | ➖ |
| Semantic search | ➖ | ➖ | ☑️ (embeddings) | ➖ |
| Web search | ☑️ (Exa/Parallel) | ☑️ (7+ providers) | ☑️ (20+ providers) | ➖ |
| Web fetch | ☑️ | ☑️ | ☑️ | ➖ |
| Code summary (tree-sitter) | ➖ | ➖ | ☑️ (native) | ➖ |
| LSP symbol search | ☑️ (experimental) | ➖ | ☑️ | ➖ |
| 55+ language grammars | ➖ | ➖ | ☑️ (tree-sitter) | ➖ |
| 70+ domain scrapers | ➖ | ➖ | ☑️ | ➖ |

## 16. Hooks / Events

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Plugin hooks | ☑️ (20+ hook types) | ☑️ | ☑️ (hooks system) | ➖ |
| Event bus | ☑️ | ☑️ | ☑️ | ➖ |
| Lifecycle events | ☑️ | ☑️ | ☑️ | ➖ |
| Before/after tool hooks | ☑️ | ☑️ | ☑️ | ➖ |
| Session events | ☑️ | ☑️ | ☑️ | ➖ |
| Audit events | ➖ | ☑️ | ➖ | ➖ |
| Trace recording | ☑️ | ☑️ (trajectory) | ☑️ | ☑️ |

## 17. Skills / Plugins

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Skill system | ☑️ (`skill` tool) | ☑️ (`skills`) | ☑️ (`skill://`) | ☑️ (find_skills stub) |
| Skill discovery | ☑️ (remote + local) | ☑️ (ClawHub) | ☑️ | ➖ |
| Skill loading | ☑️ (SKILL.md) | ☑️ | ☑️ | 🔶 (npx skills) |
| Plugin system | ☑️ | ☑️ | ☑️ | ➖ |
| Plugin marketplace | ➖ | ☑️ (ClawHub) | ☑️ (marketplace) | ➖ |
| Plugin install | ☑️ | ☑️ | ☑️ | ➖ |
| Custom agents via config | ☑️ | ☑️ | ☑️ (agent plugins) | ➖ |
| Custom tools via config | ➖ | ➖ | ☑️ (`.omp/tools/`) | ➖ |
| Custom commands | ➖ | ➖ | ☑️ | ➖ |
| Autolearn skills | ➖ | ➖ | ☑️ | ➖ |
| Skill workshop | ➖ | ☑️ | ➖ | ➖ |
| Extension API | ☑️ (plugin SDK) | ☑️ (plugin SDK) | ☑️ (ExtensionAPI) | ➖ |

## 18. Monitoring / Observability

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Structured logging | ☑️ (file logger) | ☑️ | ☑️ | ☑️ (traces JSONL) |
| OpenTelemetry | ☑️ (experimental) | ☑️ (OTel extension) | ☑️ | ➖ |
| Prometheus | ➖ | ☑️ (extension) | ➖ | ➖ |
| Cost tracking | ☑️ (per-message) | ☑️ (usage buckets) | ☑️ (per-session) | ➖ |
| Token usage stats | ☑️ | ☑️ | ☑️ (dashboard) | 🔶 (estimate) |
| Heap snapshots | ☑️ | ☑️ | ➖ | ➖ |
| Startup timing | ☑️ | ➖ | ☑️ (watchdog) | ➖ |
| Process timing | ➖ | ➖ | ➖ | ☑️ (Timer) |
| Trace recording | ☑️ | ☑️ (trajectory store) | ☑️ | ☑️ (JSONL traces) |
| Loop phase tracking | ➖ | ➖ | ➖ | ☑️ (status.json) |
| Live rate/ETA | ➖ | ➖ | ➖ | ☑️ (watch dashboard) |
| Profiler | ➖ | ➖ | ☑️ (native circular) | ➖ |
| Diagnostic support bundle | ➖ | ☑️ | ☑️ (report-bundle) | ➖ |
| Advisor/watchdog | ➖ | ➖ | ☑️ | ➖ |

## 19. Authentication

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| API key storage | ☑️ (auth.json) | ☑️ (secrets) | ☑️ (SQLite) | ☑️ (env var) |
| OAuth flows | ☑️ (16+ providers) | ☑️ | ☑️ (17+ providers) | ➖ |
| Device code flow | ☑️ (console) | ➖ | ☑️ | ➖ |
| Auth broker/gateway | ➖ | ☑️ | ☑️ (`auth-broker`) | ➖ |
| Secrets management | ☑️ | ☑️ (secrets store) | ☑️ (secrets) | ➖ |
| 1Password integration | ➖ | ➖ | ☑️ (extension) | ➖ |
| Vault integration | ➖ | ➖ | ☑️ (extension) | ➖ |
| Server auth (basic/bearer) | ☑️ | ☑️ (gateway auth) | ➑️ | ➖ |
| TLS fingerprint pinning | ➖ | ☑️ | ➖ | ➖ |
| Credential obfuscation | ➖ | ➖ | ☑️ | ➖ |

## 20. Gateway / Remote

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| WebSocket gateway | ➖ | ☑️ | ➖ | ➖ |
| Remote agent connection | ☑️ (`attach`) | ☑️ | ➖ | ➖ |
| Daemon service | ➖ | ☑️ (launchd/systemd) | ➖ | ➖ |
| Fleet management | ➖ | ☑️ | ➖ | ➖ |
| Node host (headless) | ➖ | ☑️ | ➖ | ➖ |
| Worker runtime | ➖ | ☑️ | ➖ | ➖ |
| mDNS discovery | ☑️ (experimental) | ☑️ (bonjour) | ➖ | ➖ |
| DNS/Tailscale | ➖ | ☑️ | ➖ | ➖ |
| Proxy capture | ➖ | ☑️ | ➖ | ➖ |
| Collab/live sessions | ➖ | ➖ | ☑️ | ➖ |

## 21. Other Unique Features

| Feature | opencode | openclaw | oh-my-pi | spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| ADR-driven feature extraction | ➖ | ➖ | ➖ | ☑️ |
| 4-loop hill climbing architecture | ➖ | ➖ | ➖ | ☑️ |
| Engine meta-analysis (self-improvement) | ➖ | ➖ | ➖ | ☑️ |
| Verification loop (LLM-as-judge) | ➖ | ➖ | ➖ | ☑️ |
| ADR section status tracking | ➖ | ➖ | ➖ | ☑️ |
| Messaging channel integrations | ☑️ (Slack) | ☑️ (20+ channels) | ➖ | ➖ |
| Realtime transcription | ➖ | ☑️ (Deepgram) | ➖ | ➖ |
| Meeting bot | ➖ | ☑️ (Google Meet/Zoom/Teams) | ➖ | ➖ |
| Browser extension | ➖ | ➖ | ☑️ (browser-relay) | ➖ |
| Filesystem isolation (COW) | ➖ | ➖ | ☑️ (8 backends, native Rust) | ➖ |
| Shell output minimizer | ➖ | ➖ | ☑️ (70+ filters, native Rust) | ➖ |
| Embedded shell (110 builtins) | ➖ | ➖ | ☑️ (brush shell) | ➖ |
| SIXEL terminal image | ➖ | ➖ | ☑️ (native) | ➖ |
| Clipboard read | ➖ | ➖ | ☑️ (native) | ➖ |
| Desktop automation | ➖ | ☑️ | ☑️ (native) | ➖ |
| Voice/audio capture | ➖ | ➖ | ☑️ (native) | ➖ |
| WebRTC live voice | ➖ | ➖ | ☑️ (native) | ➖ |
| Code mode (confined execution) | ☑️ (experimental) | ➖ | ➖ | ➖ |
| OpenAPI spec generation | ☑️ | ➖ | ➖ | ➖ |
| Nix flake | ☑️ | ➖ | ➖ | ➖ |
| Dockerfile | ➖ | ☑️ | ☑️ | ➖ |

---

## Summary

| Category | opencode | openclaw | oh-my-pi | spiral |
|----------|:--------:|:--------:|:-------:|:------:|
| CLI Commands | 28 | 45+ | 35 | 8 |
| Agent Modes | 5 | 8 | 12 | 5 |
| Tools | 15 | 40+ | 30 | 18 |
| LLM Providers | ~25 | ~60+ | ~75+ | 3 |
| Memory Features | 7 | 9 | 9 | 6 |
| Permission Features | 8 | 8 | 7 | 5 |
| TUI Features | 14 | 14 | 15 | 7 |
| Config Features | 10 | 10 | 10 | 3 |
| MCP Features | 7 | 8 | 8 | 4 |
| Git Features | 7 | 4 | 5 | 6 |
| Session Features | 10 | 11 | 11 | 5 |
| Streaming Features | 5 | 6 | 6 | 1 |
| Subagent Features | 6 | 7 | 8 | 1 |
| Diff/Edit Features | 9 | 7 | 11 | 4 |
| Search Features | 7 | 7 | 10 | 2 |
| Hook/Event Features | 6 | 6 | 6 | 1 |
| Skill/Plugin Features | 8 | 8 | 10 | 1 |
| Monitoring Features | 8 | 9 | 10 | 4 |
| Auth Features | 7 | 8 | 10 | 1 |
| Gateway/Remote | 4 | 9 | 2 | 0 |
| Unique Features | 2 | 4 | 8 | 5 |

### Key Takeaways

**opencode**: Strong TUI (SolidJS/OpenTUI), broad provider support, ACP protocol, worktree/snapshot system, plugin ecosystem.

**openclaw**: Most comprehensive CLI surface (45+ commands), 60+ LLM providers, full gateway/remote system, messaging channels, MCP server, fleet management. The most feature-complete harness.

**oh-my-pi**: Best native performance layer (Rust), 75+ providers, advanced memory (Mnemopi), filesystem isolation, shell minimizer, hashline patches, AST tools, 20+ web search providers, collab sessions, live voice. Most technically advanced.

**spiral**: Unique 4-loop architecture (agent → verifier → event → engine), ADR-driven autonomy, self-improving meta-loop, hierarchical memory, process timing. Smallest feature surface but most autonomous.