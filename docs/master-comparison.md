# Agent Harness Master Feature Comparison

**Harnesses compared:** jcode · OpenClaw · OpenCode · Oh My Pi (OMP) · Spiral

Merged from source-level analysis of all five repositories + prior feature comparison.
Last updated: 2026-08-12

Legend: ☑️ available · ➖ not available · 🔶 partial / experimental

---

## 1. CLI Commands

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Interactive TUI (default) | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| One-shot run (`run [msg]`) | ☑️ (`jcode run`) | ☑️ | ☑️ (`agent exec`) | ☑️ (`--print`) | ☑️ (`spiral run`) |
| Autonomous batch mode | ☑️ (`jcode run`) | ☑️ | ➖ | ➖ | ☑️ (`spiral run`) |
| Forever/continuous loop | ☑️ (`ambient`, `/overnight`) | ➖ | ➖ | ☑️ (`/loop`) | ☑️ (`spiral forever`) |
| Init from ADR | ➖ | ➖ | ➖ | ➖ | ☑️ (`spiral init`) |
| Reset state | ☑️ (`uninstall --purge`) | ☑️ (`uninstall`) | ☑️ | ☑️ (`gc`) | ☑️ (`spiral reset`) |
| Session list/delete | ☑️ (`/resume`, `/active`) | ☑️ | ☑️ | ☑️ | ☑️ (`spiral sessions`) |
| Watch/live dashboard | ☑️ (`/productivity`, menubar) | ➖ | ☑️ (`dashboard`) | ☑️ (`stats`) | ☑️ (`spiral watch`) |
| Serve/headless HTTP | ☑️ (`serve`, `api-bridge`) | ☑️ (`serve`) | ☑️ (`gateway run`) | ☑️ (`rpc`) | ➖ |
| Web UI | ➖ (desktop app in progress) | ☑️ (`web`) | ☑️ (Control UI) | ☑️ (`rpc-ui`) | ➖ |
| Attach to running server | ☑️ (`connect`) | ☑️ (`attach`) | ☑️ | ➖ | ➖ |
| ACP server mode | ☑️ (`acp`) | ☑️ (`acp`) | ☑️ | ☑️ (`acp`) | ➖ |
| Model listing | ☑️ (`model list`) | ☑️ (`models`) | ☑️ (`models list`) | ☑️ (`models`) | ➖ |
| Provider auth/login | ☑️ (`login`, `auth`, `provider`) | ☑️ (`providers login`) | ☑️ | ☑️ (`/login`) | ➖ |
| Stats/cost report | ☑️ (`usage`, `provider-test-coverage`) | ☑️ (`stats`) | ☑️ (`usage-cost`) | ☑️ (`stats`, `usage`) | ➖ |
| Plugin install/manage | ➖ (self-dev instead) | ☑️ (`plugin`) | ☑️ (`plugins`) | ☑️ (`plugin`) | ➖ |
| MCP server manage | ☑️ (`mcp` tool, `mcp.json`) | ☑️ (`mcp add/list/auth`) | ☑️ (`mcp serve/add`) | ☑️ (`/mcp`) | ➖ |
| Agent create/manage | ☑️ (`swarm`, `/agents`) | ☑️ (`agent create`) | ☑️ (`agents`) | ☑️ (`agents unpack`) | ➖ |
| Session export/import | ☑️ (`memory export`, `replay`) | ☑️ (`export`, `import`) | ☑️ (`export-trajectory`) | ☑️ (`share`) | ➖ |
| Self-upgrade | ☑️ (`update`, `server reload`) | ☑️ (`upgrade`) | ☑️ (`update`) | ☑️ (`update`) | ➖ |
| Shell completion | ➖ | ☑️ | ☑️ (`completion`) | ☑️ (`completions`) | ➖ |
| Debug/diagnostics | ☑️ (`debug`, `auth doctor`) | ☑️ (`debug`) | ☑️ (`doctor`) | ☑️ (`debug`) | ➖ |
| Config inspect/edit | ☑️ (`/config`, `config.toml`) | ☑️ | ☑️ (`config get/set`) | ☑️ (`config`) | ☑️ (env vars) |
| Git PR checkout + run | ➖ | ☑️ (`pr`) | ➖ | ☑️ (`gh-pr-checkout`) | ➖ |
| GitHub bot mode | ➖ | ☑️ (`github`) | ➖ | ➖ | ➖ |
| Cron/automations | ☑️ (`schedule` tool, `/overnight`) | ➖ | ☑️ (`cron`) | ☑️ (`/queue`) | ➖ |
| Backup/restore | ☑️ (`memory export/import`) | ➖ | ☑️ (`backup`) | ☑️ (`gc`) | ➖ |
| Fleet/multi-tenant | ☑️ (swarm multi-agent) | ➖ | ☑️ (`fleet`) | ➖ | ➖ |
| Doctor/repair | ☑️ (`provider-doctor`, `auth doctor`) | ☑️ (`debug`) | ☑️ (`doctor --fix`) | ☑️ (`doctor`) | ➖ |
| DB query shell | ➖ | ☑️ (`db`) | ➖ | ➖ | ➖ |
| DNS commands | ➖ | ➖ | ☑️ (`dns`) | ➖ | ➖ |
| Hooks management | ☑️ (`[hooks]` config) | ➖ | ☑️ (`hooks`) | ☑️ (hooks) | ➖ |
| Worktree management | ☑️ (swarm worktrees) | ☑️ (experimental) | ☑️ (`worktrees`) | ☑️ (`omp wt`) | ➖ |
| Proxy capture CLI | ➖ | ➖ | ☑️ (`proxy`) | ➖ | ➖ |
| Users management | ➖ | ➖ | ☑️ (`users`) | ➖ | ➖ |
| Capability listing | ➖ | ➖ | ☑️ (`capability`) | ➖ | ➖ |
| Docs commands | ☑️ (`jcode_docs` tool) | ➖ | ☑️ (`docs`) | ➖ | ➖ |
| System info | ☑️ (`version`) | ➖ | ☑️ (`system`) | ➖ | ➖ |
| Generate OpenAPI spec | ➖ | ☑️ (`generate`) | ➖ | ➖ | ➖ |
| Account/org management | ☑️ (`account`, multi-account) | ☑️ (`account`) | ➖ | ➖ | ➖ |
| Voice dictation | ☑️ (`dictate`, `transcript`) | ➖ | ➖ | ➖ | ➖ |
| Replay session/video | ☑️ (`replay`) | ➖ | ➖ | ➖ | ➖ |
| Pairing code (remote client) | ☑️ (`pair`) | ➖ | ☑️ (pairing) | ➖ | ➖ |
| Hotkey/setup | ☑️ (`setup-hotkey`, `setup-launcher`) | ➖ | ☑️ | ➖ | ➖ |
| Cloud session sync | ☑️ (`cloud sessions`) | ➖ | ➖ | ➖ | ➖ |

## 2. Agent Modes

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Normal (ask approval) | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| Plan mode (read-only) | ☑️ (`/plan` proposal) | ☑️ (experimental) | ➖ | ☑️ (`--plan`) | ☑️ (`--behavior plan`) |
| Bypass permissions | ☑️ | ☑️ (`--yolo`) | ☑️ (`bypassPermissions`) | ☑️ (`--yolo`) | ☑️ (`--behavior bypass`) |
| Safe mode (read-only) | 🔶 (safety tiers) | ➖ | ➖ | ➖ | ☑️ (`--behavior safe`) |
| Interactive mode | ☑️ (TUI) | ☑️ (TUI) | ☑️ (TUI) | ☑️ (TUI) | ☑️ (`--behavior interactive`) |
| Custom agents | ☑️ (`/agents` role models) | ☑️ (`agent create`) | ☑️ (agent config) | ☑️ (agent plugins) | ➖ |
| Subagent types | ☑️ (`subagent`, swarm roles) | ☑️ (explore, general) | ☑️ (subagent spawn) | ☑️ (scout, designer, reviewer, etc.) | ➖ |
| Goal mode | ☑️ (`goal`/`initiative`) | ➖ | ☑️ (`goal` tool) | ☑️ (`/goal`) | ➖ |
| Swarm mode | ☑️ (`/swarm`) | ➖ | ➖ | ☑️ (`/vibe`) | ➖ |
| Ambient (always-on) mode | ☑️ (`ambient`) | ➖ | ☑️ (channels) | ☑️ (autoresearch) | ➖ |
| Self-dev mode | ☑️ (`self-dev`) | ➖ | ➖ | ➖ | ➖ |
| Plan→Build transition | 🔶 (`/plan`) | ☑️ (plan→build agent) | ➖ | ☑️ (plan handoff) | ➖ |
| Agent generation from description | ➖ | ☑️ (LLM-generated) | ➖ | ➖ | ➖ |
| Fast mode | ☑️ (`/fast`) | ➖ | ➖ | ☑️ (`/fast`) | ➖ |
| Overnight (supervised) mode | ☑️ (`/overnight`) | ➖ | ➖ | ➖ | ➖ |
| Improve/refactor loops | ☑️ (`/improve`, `/refactor`) | ➖ | ➖ | ➖ | ➖ |

## 3. Built-in Tools

| Tool | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|------|:-----:|:--------:|:--------:|:-------:|:------:|
| read_file (offset/limit) | ☑️ (`read`, text/image/PDF) | ☑️ | ☑️ | ☑️ (ranges, binary, archives, notebooks) | ☑️ |
| write_file | ☑️ (`write`) | ☑️ (LSP diagnostics trigger) | ☑️ | ☑️ (hashline, LSP writethrough) | ☑️ |
| edit_file (search/replace) | ☑️ (`edit`) | ☑️ (fuzzy match) | ☑️ (exact replace) | ☑️ (block-replace, streaming preview) | ☑️ |
| multiedit (multi-edit one file) | ☑️ (`multiedit`) | ➖ | ➖ | ➖ | ➖ |
| apply_patch (unified diff) | ☑️ (`patch`, `apply_patch`) | ☑️ (GPT models) | ☑️ | ☑️ (apply_patch mode) | ➖ |
| grep | ☑️ (`agentgrep` w/ structure) | ☑️ (ripgrep) | ☑️ | ☑️ (native Rust) | ☑️ |
| glob | ☑️ (`agentgrep` files) | ☑️ (ripgrep) | ☑️ | ☑️ (native Rust) | ☑️ |
| bash/shell | ☑️ (`bash`, destructive gate) | ☑️ (tree-sitter parsed) | ☑️ (brush shell) | ☑️ (embedded brush, sixel) | ☑️ (`run_command`) |
| list_files | ☑️ (`ls`) | ☑️ (`ls`) | ☑️ (`ls`) | ☑️ | ☑️ |
| run_tests | ➖ (via bash) | ➖ | ➖ | ➖ | ☑️ |
| run_lint | ➖ (via bash) | ➖ | ➖ | ➖ | ☑️ |
| read_adr | ➖ | ➖ | ➖ | ➖ | ☑️ |
| mark_adr_done | ➖ | ➖ | ➖ | ➖ | ☑️ |
| find_skills / skill | ☑️ (`skill_manage`) | ☑️ (`skill`) | ☑️ (`skills search`) | ☑️ (`learn`) | 🔶 (find_skills stub) |
| webfetch | ☑️ (`webfetch`) | ☑️ | ☑️ (`web_fetch`) | ☑️ (`fetch`) | ➖ |
| websearch | ☑️ (`websearch`) | ☑️ (Exa/Parallel) | ☑️ (Brave/Exa/Tavily/etc.) | ☑️ (20+ providers) | ➖ |
| task (subagent spawn) | ☑️ (`subagent`) | ☑️ | ☑️ (`subagents`) | ☑️ (`task`) | 🔶 (SubagentManager) |
| todo | ☑️ (`todo`) | ☑️ | ➖ | ☑️ (phases, blocking) | ➖ |
| question (ask user) | ☑️ (`request_permission`) | ☑️ (multiple choice) | ☑️ (`ask_user`) | ☑️ (multi-select, recommended) | ➖ |
| lsp | ➖ | ☑️ (experimental) | ➖ | ☑️ (mux/daemon, writethrough) | ➖ |
| browser automation | ☑️ (`browser`, Firefox bridge) | ➖ | ☑️ (`browser`) | ☑️ (CMUX, ARIA, relay) | ➖ |
| computer use (desktop) | ☑️ (`macos_computer_use`) | ➖ | ☑️ (`computer`) | ☑️ (native Rust, macOS/Win/Linux) | ➖ |
| image generation | ➖ | ➖ | ☑️ | ☑️ (Gemini/OpenAI/xAI) | ➖ |
| image inspection | ☑️ (`read`) | ☑️ (read) | ☑️ | ☑️ (`inspect_image`) | ➖ |
| eval (code execution) | 🔶 (`bash`) | ☑️ (`execute` codemode) | ➖ | ☑️ (Python/JS/Ruby/Julia kernels) | ➖ |
| memory recall | ☑️ (`memory`, auto-embedding) | ➖ | ☑️ (memory search) | ☑️ (Hindsight/Mnemopi) | ➖ |
| memory retain | ☑️ (`memory`) | ➖ | ☑️ (memory files) | ☑️ | ➖ |
| memory reflect | ☑️ (sidecar/ambient) | ➖ | ➖ | ☑️ | ➖ |
| memory edit | ☑️ (`memory`) | ➖ | ➖ | ☑️ (Mnemopi) | ➖ |
| learn (autolearn skills) | ➖ | ➖ | ☑️ (workshop) | ☑️ | ➖ |
| manage_skill | ☑️ (`skill_manage`) | ➖ | ☑️ (`skills`) | ☑️ | ➖ |
| git tools | 🔶 (via bash + `/commit`) | ☑️ (git service) | ➖ (via bash) | ☑️ (`omp commit`) | ☑️ |
| session_search (RAG) | ☑️ (`session_search`) | ➖ | ➖ | ➖ | ➖ |
| conversation_search | ☑️ (`conversation_search`) | ➖ | ➖ | ➖ | ➖ |
| batch (parallel tools) | ☑️ (`batch`) | ➖ | ➖ | ➖ | ➖ |
| swarm coordination | ☑️ (`swarm`) | ➖ | ➖ | ☑️ (hub/vibe) | ➖ |
| background tasks | ☑️ (`bg`) | ☑️ (experimental) | ☑️ (detached) | ☑️ | ➖ |
| schedule (future tasks) | ☑️ (`schedule`, `schedule_ambient`) | ➖ | ☑️ (cron) | ☑️ | ➖ |
| side panel (live file/widget) | ☑️ (`side_panel`) | ➖ | ☑️ (canvas) | ➖ | ➖ |
| gmail | ☑️ (`gmail`) | ➖ | ☑️ (Gmail watcher) | ➖ | ➖ |
| docs search | ☑️ (`jcode_docs`) | ➖ | ☑️ (`docs`) | ➖ | ➖ |
| self-dev | ☑️ (`selfdev`) | ➖ | ➖ | ➖ | ➖ |
| open/launch | ☑️ (`open`) | ➖ | ➖ | ➖ | ➖ |
| MCP manage | ☑️ (`mcp`) | ☑️ | ☑️ | ☑️ (`/mcp`) | ☑️ (bridge) |
| security_scan | ➖ | ➖ | ➖ | ☑️ (SARIF, cloud import) | ➖ |
| checkpoint/rewind | ☑️ (`/rewind`) | ➖ | ➖ | ☑️ | ➖ |
| code review | ➖ | ☑️ (`/review`) | ➖ | ☑️ (P0–P3 findings) | ➖ |

## 4. LLM Providers

| Provider | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|----------|:-----:|:--------:|:--------:|:-------:|:------:|
| Anthropic | ☑️ (OAuth sub) | ☑️ | ☑️ | ☑️ | ☑️ |
| OpenAI | ☑️ (OAuth sub) | ☑️ | ☑️ | ☑️ | ☑️ |
| Ollama (local) | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| Google Gemini / Vertex | ☑️ (OAuth) | ☑️ | ☑️ | ☑️ | ➖ |
| Azure OpenAI | ☑️ | ☑️ | ☑️ | ☑️ | ➖ |
| AWS Bedrock | ☑️ | ☑️ | ☑️ | ☑️ | ➖ |
| xAI (Grok) | ☑️ (`grok-build` sub) | ☑️ | ☑️ | ☑️ | ➖ |
| Mistral | ☑️ | ☑️ | ☑️ | ☑️ | ➖ |
| Groq | ☑️ | ☑️ | ☑️ | ☑️ | ➖ |
| Cohere | ➖ | ☑️ | ☑️ | ➖ | ➖ |
| Together | ☑️ | ☑️ | ☑️ | ☑️ | ➖ |
| Perplexity | ☑️ | ☑️ | ☑️ | ☑️ | ➖ |
| DeepSeek | ☑️ | ➖ | ☑️ | ☑️ | ➖ |
| OpenRouter | ☑️ | ☑️ | ☑️ | ☑️ | ➖ |
| HuggingFace | ☑️ | ➖ | ☑️ | ☑️ | ➖ |
| GitHub Copilot | ☑️ (device flow) | ☑️ | ☑️ | ☑️ | ➖ |
| Cloudflare | ➖ | ☑️ | ☑️ | ☑️ | ➖ |
| Alibaba/Qwen | ☑️ (coding plan) | ☑️ | ☑️ | ☑️ | ➖ |
| Moonshot/Kimi | ☑️ | ➖ | ➖ | ☑️ | ➖ |
| MiniMax | ☑️ | ➖ | ➖ | ☑️ | ➖ |
| Cerebras | ☑️ | ➖ | ➖ | ☑️ | ➖ |
| Fireworks | ☑️ | ➖ | ➖ | ☑️ | ➖ |
| NVIDIA | ☑️ (`nvidia-nim`) | ➖ | ➖ | ☑️ | ➖ |
| SiliconFlow | ➖ | ➖ | ➖ | ☑️ | ➖ |
| Cursor | ☑️ | ➖ | ➖ | ☑️ | ➖ |
| Antigravity | ☑️ (OAuth) | ➖ | ➖ | ☑️ | ➖ |
| LM Studio | ☑️ (local) | ➖ | ➖ | ☑️ | ➖ |
| DeepInfra | ☑️ | ➖ | ➖ | ➖ | ➖ |
| ZAI | ☑️ | ➖ | ➖ | ☑️ | ➖ |
| Meta Muse | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Chutes | ☑️ | ➖ | ➖ | ➖ | ➖ |
| OpenAI-compatible (any) | ☑️ (custom endpoint) | ☑️ | ☑️ | ☑️ | ➖ |
| **Total providers** | **~50** | ~25 | ~60+ | ~75+ | 3 |

### Provider Features

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| OAuth device flows | ☑️ (7 native subs) | ☑️ (16+ providers) | ☑️ | ☑️ (17+ providers) | ➖ |
| Auth broker/gateway | ➖ | ➖ | ☑️ | ☑️ | ➖ |
| Model dialects (format translation) | ☑️ (`schema-dialect`) | ➖ | ➖ | ☑️ (12+ dialects) | ➖ |
| Model discovery from registry | ☑️ (live `/models`) | ☑️ (models.dev) | ☑️ (remote store) | ☑️ (auto-discovery) | ➖ |
| Model variants | ☑️ | ☑️ | ➖ | ☑️ | ➖ |
| Provider failover with backoff | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ (basic) |
| Thinking level control | ☑️ (`/effort`) | ➖ | ☑️ (thinking config) | ☑️ (none→ultrathink) | ➖ |
| Custom provider definitions | ☑️ (`provider add`, TOML) | ☑️ (config) | ☑️ (plugin) | ☑️ | ➖ |
| Per-session model override | ☑️ (`/model`) | ☑️ | ☑️ | ☑️ | ➖ |
| Multi-account switching | ☑️ (`/account`) | ☑️ (org) | ➖ | ☑️ (auth gateway) | ➖ |
| Provider doctor (E2E) | ☑️ (`provider-doctor`) | ➖ | ➖ | ➖ | ➖ |
| Live provider test coverage | ☑️ (`provider-test-coverage`) | ➖ | ➖ | ➖ | ➖ |
| Cache warm/cold warnings | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Stream idle timeout tuning | ☑️ (env/config) | ➖ | ➖ | ➖ | ➖ |
| Credential obfuscation | ☑️ | ➖ | ➖ | ☑️ | ➖ |
| Usage/cost tracking per provider | ☑️ (`usage`) | ☑️ | ☑️ | ☑️ (per-provider) | 🔶 (estimate) |

## 5. Memory / Context Management

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Context window tracking | ☑️ (per-model resolution) | ☑️ | ☑️ | ☑️ (native tokens) | ☑️ (TokenCounter) |
| Auto-compaction | ☑️ (`/compact` 3 modes) | ☑️ (summarize + prune) | ☑️ (checkpoints) | ☑️ (4 strategies) | ☑️ (ContextManager) |
| Compaction: branch summarization | ➖ | ➖ | ➖ | ☑️ | ➖ |
| Compaction: pruning | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| Compaction: semantic mode | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Session resume | ☑️ (incl. foreign harnesses) | ☑️ | ☑️ | ☑️ | 🔶 (state only) |
| Conversation history persistence | ☑️ (JSON) | ☑️ (SQLite) | ☑️ (SQLite) | ☑️ (SQLite/Redis) | ☑️ (session memory) |
| Embedding-based recall | ☑️ (all-MiniLM local) | ➖ | ☑️ (LanceDB) | ☑️ (Mnemopi vectors) | ➖ |
| Episodic/graph memory | ☑️ (graph nodes/edges) | ➖ | ☑️ (memory-core) | ☑️ (episodic-graph) | ➖ |
| Cascade retrieval (BFS graph) | ☑️ | ➖ | ➖ | ☑️ (beam search) | ➖ |
| Memory sidecar (relevance verify) | ☑️ | ➖ | ➖ | ☑️ (Hindsight) | ➖ |
| Confidence decay / forgetting | ☑️ (per-type half-life) | ➖ | ➖ | ☑️ (Weibull) | ➖ |
| Negative memories | 🔶 (planned) | ➖ | ➖ | ☑️ | ➖ |
| Procedural memories | 🔶 (planned) | ➖ | ➖ | ☑️ | ➖ |
| Provenance tracking | ☑️ | ➖ | ☑️ | ☑️ | ➖ |
| Post-retrieval maintenance | ☑️ (link/cluster/decay) | ➖ | ➖ | ☑️ | ➖ |
| Ambient memory consolidation | ☑️ | ➖ | ☑️ (dreaming) | ➖ | ➖ |
| Memory import wizard | ➖ | ➖ | ☑️ | ➖ | ➖ |
| Memory citations | ➖ | ➖ | ☑️ | ➖ | ➖ |
| Hierarchical memory (project/session/feature) | ☑️ (global/project/session) | ➖ | ➖ | ➖ | ☑️ |
| Project-level facts | ☑️ | ➖ | ➖ | ➖ | ☑️ |
| Failure pattern memory | 🔶 (negative mems) | ➖ | ➖ | ➖ | ☑️ |
| Session search (RAG) | ☑️ (`session_search`) | ➖ | ➖ | ➖ | ➖ |
| Memory CLI | ☑️ (`memory list/search/export/import`) | ➖ | ☑️ | ☑️ (Mnemopi 15 tools) | ➖ |

## 6. Permissions & Security

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Ask before destructive ops | ☑️ (bash destructive gate) | ☑️ | ☑️ | ☑️ | ☑️ |
| Auto-deny patterns | ☑️ | ☑️ (deny rules) | ☑️ (deny list) | ☑️ (deny) | ☑️ |
| Auto-approve all | ☑️ | ☑️ (`--yolo`) | ☑️ | ☑️ (`--yolo`) | ☑️ |
| Protected paths | ☑️ | ☑️ (external_dir) | ☑️ (fs policy) | ☑️ (path sandboxing) | ☑️ |
| Per-tool permission rules | ☑️ (`pre_tool` hook gate) | ☑️ | ☑️ (tool policy) | ☑️ (approval.<tool>) | 🔶 |
| Approval persistence | ☑️ | ☑️ (saved) | ☑️ (allowlist) | ☑️ | ➖ |
| Permission hooks | ☑️ (`pre_tool`/`post_tool`) | ☑️ (plugin) | ☑️ (before-tool-call) | ☑️ (hooks) | ➖ |
| Subagent permission derivation | ☑️ (swarm) | ☑️ | ☑️ | ☑️ | ➖ |
| Human-in-loop safety system (2-tier) | ☑️ (`request_permission`) | ➖ | ☑️ (operator approval) | ➖ | ➖ |
| Safety notifications (email/sms/desktop/webhook) | ☑️ | ➖ | ☑️ | ➖ | ➖ |
| Command-risk classification | ☑️ (`command-risk` crate) | ➖ | ➖ | ➖ | ➖ |
| Secret masking/redaction | ☑️ (`discover_secrets`) | ➖ | ☑️ | ☑️ (obfuscator, regex) | ➖ |
| Memory secret filtering | ☑️ | ➖ | ➖ | ➖ | ➖ |
| SSRF protection | ➖ | ➖ | ☑️ | ➖ | ➖ |
| TLS fingerprint pinning | ➖ | ➖ | ☑️ | ➖ | ➖ |
| Flood guard | ➖ | ➖ | ☑️ | ➖ | ➖ |
| Prompt-injection external wrapping | ➖ | ➖ | ☑️ | ➖ | ➖ |
| Fail-open hook policy | ☑️ | ➖ | ➖ | ➖ | ➖ |

## 7. Session Management

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Multi-session | ☑️ (server multi-client) | ☑️ | ☑️ | ☑️ | ☑️ |
| Session list | ☑️ (`/resume`, `/active`) | ☑️ | ☑️ | ☑️ | ☑️ |
| Session resume | ☑️ (by memorable name) | ☑️ | ☑️ | ☑️ | 🔶 (state only) |
| Session fork | ☑️ (`/fork`, `/split`) | ☑️ (timeline fork) | ☑️ | ☑️ (`--fork`) | ➖ |
| Session share | ➖ | ☑️ (share URLs) | ☑️ (snapshots) | ☑️ (`omp share`) | ➖ |
| Session export | ☑️ (`replay --export`) | ☑️ (redacted) | ☑️ (trajectory) | ☑️ (HTML export) | ➖ |
| Session import | ☑️ (foreign harness resume) | ☑️ | ➖ | ☑️ (Claude/Codex import) | ➖ |
| Foreign session resume | ☑️ (codex/claude/opencode/pi) | ➖ | ➖ | ☑️ | ➖ |
| Session branching | ☑️ (fork/split) | ☑️ (parentID) | ☑️ (child sessions) | ☑️ | ➖ |
| Session compaction | ☑️ (`/compact`) | ☑️ | ☑️ | ☑️ | ☑️ |
| Session revert/undo | ☑️ (`/rewind`) | ☑️ (git-based) | ➖ | ☑️ (checkpoint) | ➖ |
| Custom session ID | ➖ | ➖ | ➖ | ➖ | ☑️ (`--session-id`) |
| Session metadata | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ (context.json) |
| Session bookmarks | ☑️ (`/save`, `/unsave`) | ➖ | ☑️ | ➖ | ➖ |
| Session catch-up | ☑️ (`/catchup`, `/back`) | ➖ | ☑️ | ➖ | ➖ |
| Replay sessions/video | ☑️ (`replay`) | ➖ | ➖ | ☑️ (`/tree`) | ➖ |
| Session cloud sync | ☑️ (`cloud sessions`) | ➖ | ➖ | ➖ | ➖ |
| Session handoff | ☑️ (`/transfer`) | ➖ | ➖ | ☑️ (`/handoff`) | ➖ |
| Session move to directory | ➖ | ➖ | ☑️ | ☑️ (`/move`) | ➖ |
| Working directory management | ☑️ (`-C`, `--remote-working-dir`) | ☑️ (worktree) | ☑️ | ☑️ (`/add-dir`, `/remove-dir`) | ➖ |
| Session cost tracking | ☑️ (`/usage`) | ☑️ (per-message) | ☑️ (usage buckets) | ☑️ (per-session) | ➖ |

## 8. Streaming

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| LLM response streaming | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| Tool call streaming (partial args) | ☑️ | ☑️ | ☑️ | ☑️ | ➖ |
| Interleaved input (KV-cache aware) | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Queued input (Shift+Enter) | ☑️ | ➖ | ➖ | ➖ | ➖ |
| SSE event bridge | ☑️ | ☑️ | ☑️ | ➖ | ➖ |
| WebSocket events | ➖ | ☑️ (experimental) | ☑️ | ➖ | ➖ |
| Soft-interrupt notification injection | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Voice/audio streaming | ➖ | ➖ | ☑️ (TTS streaming) | ☑️ (WebRTC live) | ➖ |

## 9. Subagents / Tasks

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Spawn subagent | ☑️ (`subagent`, `swarm`) | ☑️ (`task`) | ☑️ (`subagents`) | ☑️ (`task`) | 🔶 (SubagentManager) |
| Background tasks | ☑️ (`bg`) | ☑️ (experimental) | ☑️ (detached) | ☑️ (vibe workers) | ➖ |
| Parallel execution | ☑️ (swarm, `batch`) | 🔶 | ☑️ (swarm) | ☑️ (parallel) | 🔶 |
| Subagent types | ☑️ (swarm roles) | ☑️ (explore, general) | ☑️ | ☑️ (scout, designer, reviewer) | ➖ |
| Task cancellation | ☑️ | ☑️ | ☑️ | ☑️ | ➖ |
| Structured output schema | 🔶 | ➖ | ☑️ | ☑️ (`outputSchema`) | ➖ |
| Task persistence/revive | ☑️ (server snapshots) | ➖ | ➖ | ☑️ (persisted-revive) | ➖ |
| Isolation worktrees | ☑️ (swarm worktrees) | ➖ | ➖ | ☑️ (`task.isolation`) | ➖ |
| Swarm coordination (DAG plan) | ☑️ (`swarm`, `SWARM_TASK_GRAPH`) | ➖ | ☑️ (taskflow) | ☑️ (hub/vibe) | ➖ |
| Coordinator + worktree manager roles | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Inter-agent messaging (DM/broadcast) | ☑️ | ➖ | ☑️ | ☑️ (vibe) | ➖ |
| Conflict detection (file touch notify) | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Completion report policy | ☑️ | ➖ | ➖ | ☑️ (yield) | ➖ |
| Recursive/deep swarm | ☑️ (`swarm-deep`) | ➖ | ➖ | ➖ | ➖ |

## 10. Diff / Editing

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Search/replace edit | ☑️ (`edit`) | ☑️ (cline/gemini-style) | ☑️ (exact replace) | ☑️ (hashline) | ☑️ |
| Full file write | ☑️ (`write`) | ☑️ | ☑️ | ☑️ | ☑️ |
| Multi-edit (one file) | ☑️ (`multiedit`) | ➖ | ➖ | ➖ | ➖ |
| Unified diff patch (V4A) | ☑️ (`patch`, `apply_patch`) | ☑️ (GPT-5) | ☑️ | ☑️ (apply_patch mode) | ➖ |
| Codex-style patch | ☑️ (`apply_patch`) | ➖ | ➖ | ➖ | ➖ |
| Diff preview / modes | ☑️ (`/diff`) | ☑️ | ☑️ | ☑️ | ➖ |
| Multi-file edit | ☑️ (via multiple) | ☑️ | ☑️ | ☑️ | ☑️ (sequential) |
| Line-ending preservation | ☑️ | ☑️ | ➖ | ☑️ | ➖ |
| Noop loop guard | 🔶 | ➖ | ➖ | ☑️ | ➖ |
| Streaming edit preview | ➖ | ➖ | ➖ | ☑️ | ➖ |

## 11. Search

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| grep (content search) | ☑️ (`agentgrep`) | ☑️ (ripgrep) | ☑️ | ☑️ (native Rust) | ☑️ |
| glob (file pattern) | ☑️ | ☑️ (ripgrep) | ☑️ (`find`) | ☑️ (native Rust) | ☑️ |
| Structural grep (function/type info) | ☑️ (`agentgrep` displacement) | ➖ | ➖ | ☑️ (AST grep) | ➖ |
| AST grep (structural) | ➖ | ➖ | ➖ | ☑️ (native ast-grep) | ➖ |
| Fuzzy file find | ☑️ (`fuzzy` crate) | ➖ | ➖ | ☑️ (native) | ➖ |
| Semantic search (embeddings) | ☑️ (memory) | ➖ | ➖ | ☑️ | ➖ |
| Session search (RAG) | ☑️ (`session_search`) | ➖ | ➖ | ➖ | ➖ |
| Conversation search | ☑️ (`conversation_search`) | ➖ | ➖ | ➖ | ➖ |
| Web search | ☑️ (`websearch`) | ☑️ (Exa/Parallel) | ☑️ (7+ providers) | ☑️ (20+ providers) | ➖ |
| Web fetch | ☑️ (`webfetch`) | ☑️ | ☑️ | ☑️ | ➖ |
| Adaptive truncation (context save) | ☑️ (agentgrep) | ➖ | ➖ | ☑️ (output minimizer) | ➖ |

## 12. Hooks / Events

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Lifecycle hooks | ☑️ (turn_end/start/end) | ☑️ (9 hook types) | ☑️ | ☑️ (hooks system) | ➖ |
| Before/after tool hooks | ☑️ (`pre_tool` gate, `post_tool`) | ☑️ | ☑️ | ☑️ | ➖ |
| Spawn hook | ☑️ (`SPAWN_HOOK`) | ➖ | ➖ | ➖ | ➖ |
| Event bus | ☑️ | ☑️ | ☑️ | ☑️ | ➖ |
| Session events | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ (status.json) |
| Trace recording | ☑️ | ☑️ | ☑️ (trajectory) | ☑️ | ☑️ (JSONL traces) |
| Hook recursion guard | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Hook config hot-reload | ☑️ | ➖ | ☑️ | ☑️ | ➖ |
| File-trigger hooks | ➖ | ➖ | ➖ | ☑️ | ➖ |
| Git-checkpoint hooks | ➖ | ➖ | ➖ | ☑️ | ➖ |
| Permission-gate hooks | ☑️ (`pre_tool`) | ➖ | ➖ | ☑️ | ➖ |

## 13. Skills / Plugins / Extensions

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Skill system | ☑️ (`skill_manage`) | ☑️ (`skill` tool) | ☑️ (`skills`) | ☑️ (`skill://`) | 🔶 (find_skills stub) |
| Skill embedding-triggered injection | ☑️ (semantic vector hit) | ➖ | ➖ | ➖ | ➖ |
| Skill discovery | ☑️ (local files) | ☑️ (remote + local) | ☑️ (ClawHub) | ☑️ | ➖ |
| Skill loading (SKILL.md) | ☑️ (`/<skillname>`) | ☑️ | ☑️ | ☑️ | 🔶 (npx skills) |
| Plugin system | ➖ (self-dev instead) | ☑️ | ☑️ | ☑️ | ➖ |
| Plugin marketplace | ➖ | ➖ | ☑️ (ClawHub) | ☑️ (marketplace) | ➖ |
| Extension API | ☑️ (SDK) | ☑️ (plugin SDK) | ☑️ (plugin SDK) | ☑️ (ExtensionAPI) | ➖ |
| Custom tools | ☑️ (`integration_tools`, MCP) | ➖ | ➖ | ☑️ (`.omp/tools/`) | ➖ |
| Autolearn skills | ➖ | ➖ | ☑️ (workshop) | ☑️ | ➖ |
| Self-dev (modify own source) | ☑️ | ➖ | ➖ | ➖ | ➖ |

## 14. MCP (Model Context Protocol)

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| MCP client | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| stdio transport | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| HTTP transport | 🔶 (recognized, skipped) | ☑️ (Streamable) | ☑️ | ☑️ | ➖ |
| SSE transport | 🔶 (recognized, skipped) | ☑️ | ☑️ | ☑️ (deprecated) | ➖ |
| MCP tool auto-registration | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| MCP CLI manage | ☑️ (`mcp` tool, config) | ☑️ | ☑️ | ☑️ | ➖ |
| Claude Code MCP compat | ☑️ (`~/.claude.json`, `.mcp.json`) | ➖ | ➖ | ➖ | ➖ |
| Codex MCP import | ☑️ (one-time) | ➖ | ➖ | ➖ | ➖ |
| MCP server (expose tools) | ➖ | ➖ | ☑️ (channels + tools) | ☑️ (Mnemopi) | ➖ |
| Shared MCP pool (across sessions) | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Smithery integration | ➖ | ➖ | ➖ | ☑️ | ➖ |

## 15. Git Integration

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| git_status | 🔶 (via bash, `/git`) | ☑️ (service) | ➖ (via bash) | ➖ (via bash) | ☑️ |
| git_diff | 🔶 (via bash) | ☑️ | ➖ | ➖ | ☑️ |
| git_commit | ☑️ (`/commit`, logical) | ☑️ | ➖ | ☑️ (`omp commit`) | ☑️ |
| git_branch | 🔶 (via bash) | ☑️ | ➖ | ➖ | ☑️ |
| git_log | 🔶 (via bash) | ☑️ | ➖ | ➖ | ☑️ |
| Swarm worktrees | ☑️ | ☑️ (experimental) | ☑️ (`worktrees`) | ☑️ (`omp wt`) | ➖ |
| Agent-native VCS (lanes/draft patches) | 🔶 (planned design) | ➖ | ➖ | ➖ | ➖ |
| Logical commit (grouped) | ☑️ (`/commit`) | ➖ | ➖ | ☑️ (map-reduce pipeline) | ➖ |
| Commit-push + release | ☑️ (`/commit-push`, `/fast-release`) | ➖ | ➖ | ➖ | ➖ |
| GitHub issue triage | ☑️ (`/triage`) | ☑️ (github bot) | ➖ | ➖ | ➖ |
| Snapshot/restore | 🔶 | ☑️ (git-based) | ☑️ (snapshot) | ☑️ (checkpoint) | ➖ |

## 16. Configuration

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Config file | ☑️ (`config.toml`) | ☑️ (`opencode.json`) | ☑️ (`openclaw.json`) | ☑️ (settings) | ➖ |
| Env vars | ☑️ | ☑️ (50+) | ☑️ | ☑️ (115+) | ☑️ (15+) |
| Per-project config | ☑️ (`.jcode/`) | ☑️ (`.opencode/`) | ☑️ | ☑️ (`.omp/`) | ➖ |
| Global config | ☑️ (`~/.jcode/`) | ☑️ (`~/.config/opencode/`) | ☑️ | ☑️ | ➖ |
| AGENTS.md support | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| CLAUDE.md support | ☑️ | ☑️ | ☑️ | ☑️ (import) | ➖ |
| Config hot-reload | ☑️ (hooks/config) | ☑️ | ☑️ (reload plans) | ➖ | ➖ |
| Config validation | ☑️ | ☑️ | ☑️ (`config validate`) | ☑️ | ➖ |
| Profile support | ☑️ (`--provider-profile`) | ➖ | ☑️ (`--profile`) | ☑️ (`--profile`) | ➖ |
| Provider env file (secrets) | ☑️ (`~/.config/jcode/`) | ➖ | ➖ | ➖ | ➖ |
| Markdown config (frontmatter) | ➖ | ☑️ | ➖ | ☑️ | ➖ |
| Config schema (Zod/serde) | ☑️ (serde typed) | ☑️ | ☑️ | ☑️ | ➖ |
| Extra body injection | ☑️ (`extra_body`) | ➖ | ➖ | ➖ | ➖ |

## 17. TUI / UI

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Interactive chat TUI | ☑️ (custom Rust) | ☑️ (OpenTUI/SolidJS) | ☑️ (Ink-like) | ☑️ (custom diff-render) | ☑️ (Ink) |
| Streaming display | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| Tool call cards | ☑️ | ☑️ | ☑️ | ☑️ | ☑️ |
| Diff viewer | ☑️ (`/diff`) | ☑️ | ☑️ | ☑️ | ➖ |
| Syntax highlighting | ☑️ | ☑️ | ☑️ | ☑️ (native Rust syntect) | ➖ |
| Themes | ☑️ (`/colors`) | ☑️ | ☑️ | ☑️ | ➖ |
| Command palette | ➖ | ☑️ | ➖ | ➖ | ➖ |
| Model picker | ☑️ (`/model`) | ☑️ | ☑️ | ☑️ | ➖ |
| Session picker | ☑️ (`/resume`) | ☑️ | ☑️ | ☑️ | ➖ |
| Agent picker | ☑️ (`/agents`) | ☑️ | ☑️ | ➖ | ➖ |
| Mermaid inline rendering | ☑️ (custom 1800x faster) | ➖ | ☑️ (inline HTML) | ☑️ | ➖ |
| Side panel (live widgets) | ☑️ | ➖ | ☑️ (canvas) | ➖ | ➖ |
| Info widgets (negative space) | ☑️ | ➖ | ➖ | ➖ | ➖ |
| 1000+ fps rendering | ☑️ | ➖ | ➖ | ➖ | ➖ |
| High refresh / low flicker | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Text alignment (centered/left) | ☑️ (`/alignment`, Alt+C) | ➖ | ➖ | ➖ | ➖ |
| Mouse support | ☑️ | ☑️ | ➖ | ☑️ | ☑️ |
| Kitty keyboard protocol | ☑️ | ➖ | ➖ | ☑️ | ➖ |
| Image rendering in terminal | 🔶 (sixel/kitty) | ➖ | ➖ | ☑️ (sixel/kitty) | ➖ |
| Scrollback (custom) | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Multi-line input | ☑️ (Shift+Enter) | ☑️ | ☑️ (Shift+Enter) | ☑️ | ☑️ (Shift+Enter) |
| Input interleaving (KV-aware) | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Menubar indicator (macOS) | ☑️ (`menubar`) | ➖ | ➖ | ➖ | ➖ |
| Swarm/plan info widgets | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Thinking display toggle | ☑️ (`/thinking`) | ➖ | ☑️ | ➖ | ➖ |
| Terminal capability matrix | ☑️ (documented) | ➖ | ➖ | ➖ | ➖ |
| Onboarding wizard | ☑️ (`/onboarding-preview`) | ☑️ | ☑️ (wizard) | ☑️ (setup-wizard) | ➖ |
| Desktop app (native) | ☑️ (desktop2, in progress) | ☑️ (Electron) | ➖ | ➖ | ➖ |
| iOS app (Tailscale) | 🔶 (planned) | ➖ | ☑️ (nodes) | ➖ | ➖ |

## 18. Monitoring / Observability

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Structured logging | ☑️ | ☑️ (file logger) | ☑️ | ☑️ | ☑️ (traces JSONL) |
| OpenTelemetry (OTLP) | ➖ | ☑️ (experimental) | ☑️ (OTel extension) | ☑️ | ➖ |
| Telemetry (anonymous usage) | ☑️ (`/telemetry`) | ➖ | ➖ | ➖ | ➖ |
| Cost tracking | ☑️ (`/usage`) | ☑️ (per-message) | ☑️ (usage buckets) | ☑️ (per-session) | ➖ |
| Token usage stats | ☑️ | ☑️ | ☑️ | ☑️ (dashboard) | 🔶 (estimate) |
| Trace recording | ☑️ (replay) | ☑️ | ☑️ (trajectory store) | ☑️ | ☑️ (JSONL traces) |
| Cache warm/cold warnings | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Provider test coverage ledger | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Feedback (thumbs up/down) | ☑️ (`/feedback`) | ➖ | ➖ | ➖ | ➖ |
| Productivity report | ☑️ (`/productivity`) | ➖ | ➖ | ☑️ | ➖ |
| Loop phase tracking | ➖ | ➖ | ➖ | ➖ | ☑️ (status.json) |
| Live rate/ETA | ➖ | ➖ | ➖ | ➖ | ☑️ (watch dashboard) |
| Process timing per loop | ➖ | ➖ | ➖ | ➖ | ☑️ (Timer) |

## 19. Gateway / Remote / Infrastructure

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Single-server multi-client | ☑️ (`serve` daemon) | ☑️ (`attach`) | ☑️ | ➖ | ➖ |
| Remote agent connection | ☑️ (`connect`, `pair`) | ☑️ (`attach`) | ☑️ | ➖ | ➖ |
| Daemon service | ☑️ (setsid daemon) | ➖ | ☑️ (launchd/systemd/schtasks) | ➖ | ➖ |
| Hot reload (server exec new binary) | ☑️ (`server reload`) | ☑️ (config watcher) | ☑️ (reload plans) | ➖ | ➖ |
| Client auto-reconnect | ☑️ | ☑️ | ☑️ | ➖ | ➖ |
| Harness API / SDK | ☑️ (`api-bridge`, TS SDK) | ☑️ (SDK) | ➖ | ➖ | ➖ |
| Self-dev canary sessions | ☑️ | ➖ | ➖ | ➖ | ➖ |
| Remote working dir separation | ☑️ (`--remote-working-dir`) | ➖ | ☑️ (workspace rsync) | ➖ | ➖ |
| Graceful shutdown / reload recovery | ☑️ | ➖ | ☑️ | ➖ | ➖ |
| Reboot snapshot/restore | ☑️ (`restart save/restore`) | ➖ | ➖ | ➖ | ➖ |
| Fleet management | 🔶 (swarm) | ➖ | ☑️ (Docker/Podman) | ➖ | ➖ |
| mDNS/Bonjour discovery | ➖ | ☑️ (experimental) | ☑️ | ➖ | ➖ |
| iOS/remote mobile (Tailscale) | 🔶 (planned) | ➖ | ☑️ | ➖ | ➖ |

## 20. Channels & Messaging

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Multi-channel messaging | 🔶 (safety notifications only) | ➖ (Slack only) | ☑️ (Discord, Telegram, WhatsApp, Slack, Nostr, Synology, Teams, IRC, 10+ more) | ➖ | ➖ |
| Inter-agent messaging (DM/broadcast) | ☑️ (swarm) | ➖ | ➖ | ☑️ (hub) | ➖ |
| Gmail tool | ☑️ | ➖ | ☑️ (watcher) | ➖ | ➖ |
| Safety notification channels | ☑️ (email/sms/desktop/webhook) | ➖ | ➖ | ➖ | ➖ |
| Polls | ➖ | ➖ | ☑️ | ➖ | ➖ |
| Meeting bot | ➖ | ➖ | ☑️ | ➖ | ➖ |

## 21. Voice / Audio / Media

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Voice dictation (external STT) | ☑️ (`dictate`, `transcript`) | ➖ | ➖ | ➖ | ➖ |
| Realtime voice sessions | ➖ | ➖ | ☑️ (provider-backed) | ☑️ (WebRTC) | ➖ |
| TTS (text-to-speech) | ➖ | ➖ | ☑️ (provider-backed) | ☑️ (Kokoro local, xAI Grok) | ➖ |
| STT (speech-to-text) | 🔶 (external command) | ➖ | ☑️ (Deepgram) | ☑️ (Sherpa runtime) | ➖ |
| Image generation | ➖ | ➖ | ☑️ | ☑️ (Gemini/OpenAI/xAI) | ➖ |
| Image understanding | ☑️ (`read` image) | ☑️ (attachment normalization) | ☑️ | ☑️ (`inspect_image`) | ➖ |
| PDF extraction | ☑️ (`pdf` crate) | ➖ | ☑️ (`pdf`) | ☑️ (Markit) | ➖ |
| Desktop computer use | ☑️ (`macos_computer_use`) | ➖ | ☑️ | ☑️ (native) | ➖ |
| Browser automation | ☑️ (`browser` Firefox) | ➖ | ☑️ | ☑️ (CMUX) | ➖ |

## 22. Slash Commands

| Feature | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:-----:|:--------:|:--------:|:-------:|:------:|
| Custom slash commands | 🔶 (dynamic skills only) | ☑️ (config) | ☑️ (auto-reply) | ☑️ (file-based) | ☑️ (built-in only) |
| Commands from MCP prompts | ➖ | ☑️ | ➖ | ☑️ | ➖ |
| Commands from skills | ☑️ (`/<skillname>`) | ☑️ | ☑️ | ☑️ | ➖ |
| Built-in `/init` | ➖ | ☑️ | ➖ | ➖ | ☑️ (`spiral init`) |
| Built-in `/review` | ➖ | ☑️ | ➖ | ☑️ | ➖ |
| Total slash commands | ~126 | ~10 | ~20 | 80+ | 12 |

### jcode Slash Commands (unique)

| Command | Purpose |
|---------|---------|
| `/swarm`, `/swarm-prompt` | Multi-agent swarm on/off + routing |
| `/plan` | Plan-only proposal card |
| `/improve`, `/refactor` | Autonomous repo improvement / safe refactor loops |
| `/overnight` | Supervised coordinator (hours, review, log) |
| `/selfdev`, `/rebuild`, `/reload` | Self-development + build/reload |
| `/commit`, `/commit-push`, `/fast-release`, `/triage` | Git ops + releases |
| `/memory` | Memory on/off/status |
| `/compact mode <reactive\|proactive\|semantic>` | Compaction modes |
| `/rewind`, `/poke`, `/fix` | Recovery/poking |
| `/catchup`, `/back`, `/transfer` | Session catch-up + handoff |
| `/save`, `/unsave`, `/rename`, `/fork` | Session bookmarks + branching |
| `/diff` | Diff display modes |
| `/effort`, `/fast`, `/transport` | Model/transport control |
| `/agents`, `/subagent-model` | Agent role models |
| `/thinking`, `/show-agentgrep-output` | Display toggles |
| `/dictate`, `/terminal-setup` | Input setup |
| `/productivity`, `/feedback`, `/telemetry` | Usage + feedback |
| `/hotkeys`, `/keys`, `/colors` | TUI config |
| `/overnight` | Ambient supervision |
| `/mission`, `/goal` | Initiatives (disabled) |
| `/z`, `/zz`, `/zzz` | Hidden premium mode |

## 23. Unique to Each Harness

### Only in jcode

| Feature | Description |
|---------|-------------|
| Blazing-fast Rust TUI | 27.8 MB RAM / 14 ms first frame / 1000+ fps, custom renderer, low flicker |
| Mermaid inline rendering | Custom `mermaid-rs-renderer`, ~1800× faster, no browser/TS dep |
| Single-server multi-client daemon | `jcode serve` + reconnect-on-reload clients over Unix socket |
| Hot reload (server exec) | Server execs new binary, clients auto-reconnect; `server reload` |
| Self-dev mode | Agent modifies/rebuilds/tests its own source, reloads binary live |
| Agent-native VCS (planned) | Lane-first VCS with draft patches, maintenance packets, anchors |
| Swarm (DAG task graph) | Coordinator + worktree managers, inter-agent DM/broadcast, conflict notify |
| Memory graph + cascade retrieval | Embedding graph, sidecar relevance verify, post-retrieval maintenance |
| Semantic skill injection | Skills auto-injected on embedding hit, no startup loading |
| Agentgrep with structure | Grep returns function displacement + adaptive truncation |
| Side panel + info widgets | Live files/widgets in negative space, mermaid, real-time updates |
| Foreign session resume | Resume codex/claude/opencode/pi sessions where they broke |
| Provider doctor + test coverage | Live E2E provider diagnosis + coverage ledger |
| Multi-account subscription switching | `/account` switch between ChatGPT/Claude subs |
| Cache warm/cold warnings | Warns on Anthropic 5-min cache expiry + unexpected miss |
| Interleaved input (KV-aware) | Sends input without breaking KV cache; Shift+Enter queues |
| Command-risk classification | `command-risk` crate gates destructive shell |
| Lifecycle + spawn hooks | turn_end/start/end, pre_tool gate, post_tool, spawn hook |
| Safety system (2-tier HITL) | Auto-allowed vs requires-permission, notification channels |
| TS SDK / harness API | `@1jehuang/jcode-sdk` over Unix socket |
| Replay sessions/video | Replay saved sessions, export as video |
| Cloud session sync | `cloud sessions` upload/sync/view to cloud storage |
| macOS menubar indicator | Live session count indicator |
| Reboot snapshot | `restart save/restore` window state across reboot |
| Extra-body injection | `extra_body` for backends needing non-standard fields |
| OpenAPI-compatible custom providers | ~34 named profiles + any custom endpoint |
| `extra_body`/stream-idle tuning | Provider edge-case workarounds |

### Only in OpenClaw

| Feature | Description |
|---------|-------------|
| Multi-channel messaging (15+ platforms) | Discord, Telegram, WhatsApp, Slack, Nostr, Synology Chat, Xiaomi, MS Teams, IRC, and more |
| Meeting bot | Google Meet, Zoom, Teams integration with STT + agent consult |
| Canvas (inline HTML widgets) | Agent-facing inline chat widget with pinning, sizing, capabilities |
| Boards/workboard | Widget sandboxing, data binding, action verbs, cron triggers |
| Fleet management | Docker/Podman container orchestration with port allocation |
| Daemon management | systemd, launchd, Windows Task Scheduler |
| Worker/cloud environments | Workspace rsync, remote inference, VNC view-only |
| Proxy capture | HTTP proxy recording for deterministic test fixtures |
| 24-language i18n | Control UI translated into 24 locales |
| ClawHub skill workshop | Proposals, evaluation, quarantine, self-learning |
| Link understanding | Auto-detect and understand links in messages |
| Polls | Poll creation and voting |
| Node host (Android/iOS/macOS) | Mobile device pairing with camera, screen, location, notifications |
| SSRF protection, TLS fingerprint, flood guard | Security infrastructure |
| Gateway server with WebSocket RPC | Full HTTP + WebSocket gateway |
| Operator approval system | Authorization with iOS push delivery |
| Exec approval system | Command approval with timeout and manager |
| Device pairing | Bluetooth/QR pairing with auto-approve |
| Audit system | Recorder, event store, identity resolution |
| Task flow registry | Coordinated multi-step task orchestration |
| Context engine | Delegate, init, registry, quarantine health, runtime settings |
| Pairing system | Setup codes, LAN/Tailscale URL resolution, bootstrap tokens |
| Routing system | Account ID, bindings, channel route targets, peer kind match |
| Model catalog with remote store | Remote overlay, pricing, manifest planner |

### Only in OpenCode

| Feature | Description |
|---------|-------------|
| Git-based snapshot revert | Undo any agent change via git stash, revert/unrevert at any message |
| Plan/Build mode transition | Plan agent creates plan file, build agent executes, plan_exit tool |
| GitHub App agent | Issues, PRs, workflow automation, mock event testing |
| VS Code extension | Editor-embedded agent sessions, auto-install |
| ACP server (IDE integration) | Full ACP with fork, setMode, setModel, profile/usage |
| OpenAPI spec auto-generation | Auto-generated from HTTP API |
| mDNS/Bonjour service discovery | Local network service advertisement |
| Enterprise sharing service | Custom URL sharing with extended storage backends |
| Managed preferences (MDM) | macOS enterprise MDM plist support |
| 9 code formatters | gofmt, mix, prettier, ruff, stylua, nixfmt, gleam, oxfmt, typstfmt |
| Variable substitution in config | `{env:VAR}` and `{file:path}` |
| models.dev registry integration | Fetch model metadata from models.dev |
| Control plane / multi-workspace | Workspace creation, listing, session moving, adapter runtimes |
| SDK & client libraries | Auto-generated TypeScript SDK from OpenAPI spec |
| DB query shell | `opencode db` SQLite shell |
| Session sharing (opncd.ai) | Public share URLs with incremental sync |

### Only in Oh My Pi

| Feature | Description |
|---------|-------------|
| Native Rust acceleration | grep, glob, AST, shell, clipboard, desktop, voice, image, snapcompact, tokens |
| 60+ site-specific web scrapers | GitHub, arXiv, Reddit, YouTube, npm, PyPI, MDN, etc. |
| Multi-language eval (Python/JS/Ruby/Julia) | Persistent kernels with streaming output |
| Browser automation | Headless, CMUX, ARIA snapshots, browser relay, screenshot |
| Snapcompact (bitmap compaction) | Archive context as PNG frames vision models read back |
| AST-level code editing | Structural code editing via Rust AST engine |
| Vibe mode (multi-agent) | Spawn/send/wait/kill/list persistent worker sessions |
| Goals system | Persistent, budgeted goal tracking |
| Autoresearch | Automated experiments with git branch management |
| Cleanse (auto-repair) | Diagnostic-driven bounded repair agents |
| Agentic commit | AI commit messages via map-reduce, split-commit, changelog |
| Hub (agent coordination) | IRC bus, peer messaging, process supervision |
| Internal URL protocols (15+) | omp://, agent://, artifact://, memory://, security://, etc. |
| Mnemopi (full memory system) | Vector index, episodic graph, entities, triples, beam search, polyphonic recall, Weibull decay |
| Hindsight memory backend | Bank, mental models, transcript, retention cache |
| Autolearn (auto skill creation) | Learn from sessions, create/enhance managed skills |
| 80+ shell builtins | bash-compatible shell with 80+ builtins + coreutils |
| Security scanning with SARIF | SARIF import/export, seeded repo, finding validation |
| Live collaboration (E2E encrypted) | AES-256-GCM, relay server, guest replication |
| Metaharness (benchmarks) | Harbor benchmark runner with live dashboard |
| RoboMP (GitHub automation) | Python webhook-driven issue/PR worker with sandbox |
| DAP debugger | Breakpoints, variables, stack traces, disassembly, profiling |
| Checkpoint/rewind | Save investigation checkpoints and rewind to them |
| Markit (document conversion) | PDF, DOCX, EPUB, PPTX, XLSX → markdown |
| Hashline (line-anchored edits) | Hash-based line identification, block resolution, streaming |
| Omptype (schema validation) | ArkType-compatible JIT runtime, JSON Schema emission |
| Auth gateway (account pooling) | HTTP gateway for routing AI provider requests |
| Provider dialects (12+) | Anthropic, Gemini, GLM, Kimi, MiniMax, Qwen3, DeepSeek, etc. |
| Cross-platform isolation (CoW) | APFS, OverlayFS, Btrfs, ZFS, FICLONE, ProjFS, Rcopy |

### Only in Spiral

| Feature | Description |
|---------|-------------|
| ADR-driven feature extraction | Parse Architecture Decision Records for features |
| 4-loop hill climbing architecture | agent → verifier → event → engine loops |
| Engine meta-analysis (self-improvement) | Meta-loop that analyzes and improves the engine |
| Verification loop (LLM-as-judge) | LLM verifies agent output quality |
| ADR section status tracking | Track status of ADR sections |
| Forever/continuous loop mode | `spiral forever` runs continuously |
| Init from ADR | `spiral init` initializes from ADRs |
| Safe mode (read-only) | `--behavior safe` read-only mode |
| run_tests tool | Built-in test runner tool |
| run_lint tool | Built-in linter tool |
| Hierarchical memory (project/session/feature) | Three-tier memory hierarchy |
| Failure pattern memory | Remember failure patterns |
| Live rate/ETA | Real-time rate and ETA in watch dashboard |
| Loop phase tracking | Track loop phases via status.json |
| Custom session IDs | `--session-id` for explicit session identification |
| Process timing per loop | Per-feature, per-loop (agent/verifier/engine) timing breakdown |
| 5 agent modes | normal, plan, bypass, safe, interactive |

---

## Grand Summary

| Dimension | jcode | OpenCode | OpenClaw | Oh My Pi | Spiral |
|-----------|:-----:|:--------:|:--------:|:-------:|:------:|
| **CLI Commands** | 30+ | 28 | 45+ | 35 | 8 |
| **Agent Modes** | 9 | 5 | 8 | 12+ | 5 |
| **Built-in Tools** | 31 | 15 | 40+ | 30+ | 18 |
| **LLM Providers** | ~50 | ~25 | ~60+ | ~75+ | 3 |
| **Memory Features** | 12+ | 7 | 9 | 9+ | 6 |
| **Permission/Security Features** | 10+ | 8 | 17+ | 10+ | 5 |
| **TUI Features** | 20+ | 14 | 14 | 18+ | 8 |
| **Config Features** | 10+ | 10 | 10 | 10 | 3 |
| **MCP Features** | 6+ | 7 | 8 | 8+ | 4 |
| **Git Features** | 5+ | 7 | 4 | 5+ | 6 |
| **Session Features** | 14+ | 10 | 11 | 15+ | 5 |
| **Streaming Features** | 5+ | 5 | 6 | 6 | 1 |
| **Subagent/Task Features** | 9+ | 6 | 7 | 8+ | 1 |
| **Diff/Edit Features** | 6+ | 9 | 7 | 11+ | 4 |
| **Search Features** | 8+ | 7 | 7 | 10+ | 2 |
| **Hook/Event Features** | 6+ | 6 | 6 | 10+ | 1 |
| **Skill/Plugin Features** | 6+ | 8 | 8 | 10+ | 1 |
| **Monitoring Features** | 8+ | 8 | 9 | 10+ | 5 |
| **Auth Features** | 10+ | 7 | 8 | 10+ | 1 |
| **Gateway/Remote** | 8+ | 4 | 9 | 2 | 0 |
| **Channel Features** | 4+ | 1 | 15+ | 0 | 0 |
| **Voice/Media Features** | 6+ | 1 | 10+ | 12+ | 0 |
| **Slash Commands** | ~126 | ~10 | ~20 | 80+ | 12 |
| **Unique Features** | 15+ | 4 | 2 | 8+ | 9 |

### Key Takeaways

**jcode** — The new leader on performance and multi-agent coordination. Blazing-fast Rust TUI (27.8 MB / 14 ms first frame, ~1000 fps), single-server multi-client daemon with hot reload, self-dev mode (agent modifies its own source), graph-based memory with cascade retrieval, DAG-driven swarm coordination with inter-agent messaging, semantic skill injection, provider doctor with live coverage, multi-account subscription switching, and ~50 providers. Best-in-class resource efficiency for scaling multi-session workflows. Weakest areas: no plugin marketplace (self-dev substitutes), no multi-channel chat/voice, no web UI yet (desktop + iOS in progress).

**OpenClaw** — The most feature-complete harness for always-on personal assistance. Richest channel system (15+ platforms), meeting bot, voice sessions, fleet/daemon management, security infrastructure, 24-language UI, ClawHub marketplace.

**OpenCode** — Best for IDE-integrated coding. Cleanest config system, ACP/VS Code integration, git-based revert, plan/build workflow, GitHub App agent, 9 code formatters, models.dev registry, enterprise features, OpenAPI spec generation, control plane.

**Oh My Pi** — Most technically advanced and broadest tool surface. Native Rust acceleration, 75+ providers, 60+ scrapers, multi-language eval, snapcompact compaction, Mnemopi memory, vibe mode, goals, agentic commit, hub, 80+ slash commands, live collab, DAP debugger, cross-platform isolation.

**Spiral** — Smallest feature surface but most autonomous. Unique 4-loop architecture (agent→verifier→event→engine), ADR-driven autonomy, self-improving meta-loop, hierarchical memory with failure patterns, forever mode, built-in test/lint tools. Focused on self-improving autonomous coding rather than interactive assistance.
