# Agent Harness Master Feature Comparison

**Harnesses compared:** OpenClaw · OpenCode · Oh My Pi (OMP) · Spiral

Merged from source-level analysis of all four repositories + prior feature comparison.
Last updated: 2026-08-11

Legend: ☑️ available · ➖ not available · 🔶 partial / experimental

---

## 1. CLI Commands

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Interactive TUI (default) | ☑️ | ☑️ | ☑️ | ☑️ |
| One-shot run (`run [msg]`) | ☑️ | ☑️ (`agent exec`) | ☑️ (`--print`) | ☑️ (`spiral run`) |
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
| MCP server manage | ☑️ (`mcp add/list/auth`) | ☑️ (`mcp serve/add`) | ☑️ (`/mcp`) | ➖ |
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
| DNS commands | ➖ | ☑️ (`dns`) | ➖ | ➖ |
| Hooks management | ➖ | ☑️ (`hooks`) | ➖ | ➖ |
| Worktree management | ☑️ (experimental) | ☑️ (`worktrees`) | ☑️ (`omp wt`) | ➖ |
| Proxy capture CLI | ➖ | ☑️ (`proxy`) | ➖ | ➖ |
| Users management | ➖ | ☑️ (`users`) | ➖ | ➖ |
| Capability listing | ➖ | ☑️ (`capability`) | ➖ | ➖ |
| Docs commands | ➖ | ☑️ (`docs`) | ➖ | ➖ |
| System info | ➖ | ☑️ (`system`) | ➖ | ➖ |
| Generate OpenAPI spec | ☑️ (`generate`) | ➖ | ➖ | ➖ |
| Account/org management | ☑️ (`account`) | ➖ | ➖ | ➖ |

## 2. Agent Modes

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
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
| Orchestrate keyword | ➖ | ➖ | ☑️ (typing "orchestrate") | ➖ |
| Loop mode | ➖ | ➖ | ☑️ (`/loop`) | ☑️ (`spiral forever`) |
| Queue mode | ➖ | ➖ | ☑️ (`/queue`) | ➖ |
| Fast mode | ➖ | ➖ | ☑️ (`/fast`) | ➖ |
| Computer use mode | ➖ | ➖ | ☑️ (`/computer`) | ➖ |
| Vision mode | ➖ | ➖ | ☑️ (`/vision`) | ➖ |
| Plan→Build transition | ☑️ (plan→build agent) | ➖ | ☑️ (plan handoff) | ➖ |
| Magic keywords | ➖ | ➖ | ☑️ (orchestrate, ultrathink) | ➖ |
| RPC mode | ➖ | ➖ | ☑️ (`rpc`) | ➖ |
| Agent generation from description | ☑️ (LLM-generated) | ➖ | ➖ | ➖ |

## 3. Built-in Tools

| Tool | OpenCode | OpenClaw | Oh My Pi | Spiral |
|------|:--------:|:--------:|:-------:|:------:|
| read_file (offset/limit) | ☑️ | ☑️ | ☑️ (ranges, binary, archives, notebooks) | ☑️ |
| write_file | ☑️ (LSP diagnostics trigger) | ☑️ | ☑️ (hashline, LSP writethrough) | ☑️ |
| edit_file (search/replace) | ☑️ (fuzzy match) | ☑️ (exact replace) | ☑️ (block-replace, streaming preview) | ☑️ |
| apply_patch (unified diff) | ☑️ (GPT models) | ☑️ | ☑️ (apply_patch mode) | ➖ |
| grep | ☑️ (ripgrep) | ☑️ | ☑️ (native Rust) | ☑️ |
| glob | ☑️ (ripgrep) | ☑️ | ☑️ (native Rust) | ☑️ |
| bash/shell | ☑️ (tree-sitter parsed) | ☑️ (brush shell) | ☑️ (embedded brush, sixel) | ☑️ (`run_command`) |
| list_files | ☑️ (`ls`) | ☑️ (`ls`) | ☑️ | ☑️ |
| run_tests | ➖ | ➖ | ➖ | ☑️ |
| run_lint | ➖ | ➖ | ➖ | ☑️ |
| read_adr | ➖ | ➖ | ➖ | ☑️ |
| mark_adr_done | ➖ | ➖ | ➖ | ☑️ |
| find_skills / skill | ☑️ (`skill`) | ☑️ (`skills search`) | ☑️ (`learn`) | ☑️ (find_skills stub) |
| webfetch | ☑️ | ☑️ (`web_fetch`) | ☑️ (`fetch`) | ➖ |
| websearch | ☑️ (Exa/Parallel) | ☑️ (Brave/Exa/Tavily/etc.) | ☑️ (20+ providers) | ➖ |
| task (subagent spawn) | ☑️ | ☑️ (`subagents`) | ☑️ (`task`) | 🔶 (SubagentManager) |
| todo | ☑️ | ➖ | ☑️ (phases, blocking) | ➖ |
| question (ask user) | ☑️ (multiple choice) | ☑️ (`ask_user`) | ☑️ (multi-select, recommended) | ➖ |
| lsp | ☑️ (experimental) | ➖ | ☑️ (mux/daemon, writethrough) | ➖ |
| browser automation | ➖ | ☑️ (`browser`) | ☑️ (CMUX, ARIA, relay) | ➖ |
| computer use (desktop) | ➖ | ☑️ (`computer`) | ☑️ (native Rust, macOS/Win/Linux) | ➖ |
| image generation | ➖ | ☑️ | ☑️ (Gemini/OpenAI/xAI) | ➖ |
| image inspection | ☑️ (read) | ☑️ | ☑️ (`inspect_image`) | ➖ |
| eval (code execution) | ☑️ (`execute` codemode) | ➖ | ☑️ (Python/JS/Ruby/Julia kernels) | ➖ |
| debug (DAP) | ➖ | ➖ | ☑️ (breakpoints, profiling) | ➖ |
| memory recall | ➖ | ☑️ (memory search) | ☑️ (Hindsight/Mnemopi) | ➖ |
| memory retain | ➖ | ☑️ (memory files) | ☑️ | ➖ |
| memory reflect | ➖ | ➖ | ☑️ | ➖ |
| memory edit | ➖ | ➖ | ☑️ (Mnemopi) | ➖ |
| learn (autolearn skills) | ➖ | ➖ | ☑️ | ➖ |
| manage_skill | ➖ | ➖ | ☑️ | ➖ |
| git_status | ☑️ (git service) | ➖ (via bash) | ➖ (via bash) | ☑️ |
| git_diff | ☑️ | ➖ | ➖ | ☑️ |
| git_add | ☑️ | ➖ | ➖ | ☑️ |
| git_commit | ☑️ | ➖ | ☑️ (`omp commit`) | ☑️ |
| git_branch | ☑️ | ➖ | ➖ | ☑️ |
| git_log | ☑️ | ➖ | ➖ | ☑️ |
| ast_grep (structural search) | ➖ | ➖ | ☑️ (native Rust) | ➖ |
| ast_edit (AST editing) | ➖ | ➖ | ☑️ | ➖ |
| checkpoint/rewind | ➖ | ➖ | ☑️ | ➖ |
| security_scan | ➖ | ➖ | ☑️ (SARIF, cloud import) | ➖ |
| code review | ☑️ (`/review`) | ➖ | ☑️ (P0–P3 findings) | ➖ |
| music generation | ➖ | ☑️ | ➖ | ➖ |
| video generation | ➖ | ☑️ | ➖ | ➖ |
| TTS (text-to-speech) | ➖ | ☑️ (provider-backed) | ☑️ (Kokoro local, xAI Grok) | ➖ |
| STT (speech-to-text) | ➖ | ☑️ (Deepgram) | ☑️ (Sherpa runtime) | ➖ |
| PDF extraction | ➖ | ☑️ (`pdf`) | ☑️ (read PDF + Markit) | ➖ |
| hub (agent coordination) | ➖ | ➖ | ☑️ (IRC bus, process supervision) | ➖ |
| vibe (multi-agent workers) | ➖ | ➖ | ☑️ (spawn/send/wait) | ➖ |
| goal (persistent goals) | ➖ | ➖ | ☑️ (budgeted) | ➖ |
| resolve/reject/propose | ➖ | ➖ | ☑️ (staged finalization) | ➖ |
| yield (subagent result) | ➖ | ➖ | ☑️ (schema validation) | ➖ |
| plan_exit | ☑️ | ➖ | ➖ | ➖ |
| canvas widget | ➖ | ☑️ (inline HTML) | ➖ | ➖ |

## 4. LLM Providers

| Provider | OpenCode | OpenClaw | Oh My Pi | Spiral |
|----------|:--------:|:--------:|:-------:|:------:|
| Anthropic | ☑️ | ☑️ | ☑️ | ☑️ |
| OpenAI | ☑️ | ☑️ | ☑️ | ☑️ |
| Ollama (local + cloud) | ☑️ | ☑️ | ☑️ | ☑️ |
| Google Gemini / Vertex | ☑️ | ☑️ | ☑️ | ➖ |
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
| MiniMax | ➖ | ➖ | ☑️ | ➖ |
| Cerebras | ➖ | ➖ | ☑️ | ➖ |
| Fireworks | ➖ | ➖ | ☑️ | ➖ |
| Nanogpt | ➖ | ➖ | ☑️ | ➖ |
| Novita | ➖ | ➖ | ☑️ | ➖ |
| NVIDIA | ➖ | ➖ | ☑️ | ➖ |
| SiliconFlow | ➖ | ➖ | ☑️ | ➖ |
| vLLM | ➖ | ➖ | ☑️ | ➖ |
| Zhipu/ZAI | ➖ | ➖ | ☑️ | ➖ |
| Xiaomi | ➖ | ➖ | ☑️ | ➖ |
| Sakana | ➖ | ➖ | ☑️ | ➖ |
| Venice | ➖ | ➖ | ☑️ | ➖ |
| Wafer | ➖ | ➖ | ☑️ | ➖ |
| LiteLLM | ➖ | ➖ | ☑️ | ➖ |
| LM Studio | ➖ | ➖ | ☑️ | ➖ |
| llama.cpp | ➖ | ➖ | ☑️ | ➖ |
| Vercel AI Gateway | ➖ | ➖ | ☑️ | ➖ |
| CoreWeave | ➖ | ➖ | ☑️ | ➖ |
| Baseten | ➖ | ➖ | ☑️ | ➖ |
| GMI Cloud | ➖ | ➖ | ☑️ | ➖ |
| Google Antigravity | ➖ | ➖ | ☑️ | ➖ |
| Cursor | ➖ | ➖ | ☑️ | ➖ |
| Devin | ➖ | ➖ | ☑️ | ➖ |
| GitLab Duo | ➖ | ➖ | ☑️ | ➖ |
| Opencode (as provider) | ➖ | ➖ | ☑️ | ➖ |
| Zenmux | ➖ | ➖ | ☑️ | ➖ |
| DigitalOcean | ☑️ | ➖ | ➖ | ➖ |
| Modal | ☑️ | ➖ | ➖ | ➖ |
| Poe | ☑️ | ➖ | ➖ | ➖ |
| GitLab | ☑️ | ➖ | ☑️ | ➖ |
| **Total providers** | ~25 | ~60+ | ~75+ | 3 |

### Provider Features

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| OAuth device flows | ☑️ (16+ providers) | ☑️ | ☑️ (17+ providers) | ➖ |
| Auth broker/gateway | ➖ | ☑️ | ☑️ | ➖ |
| Model dialects (format translation) | ➖ | ➖ | ☑️ (12+ dialects) | ➖ |
| Model discovery from registry | ☑️ (models.dev) | ☑️ (remote store) | ☑️ (auto-discovery) | ➖ |
| Model variants | ☑️ | ➖ | ☑️ | ➖ |
| Provider failover with backoff | ☑️ | ☑️ | ☑️ | ☑️ (basic) |
| Thinking level control | ➖ | ☑️ (thinking config) | ☑️ (none→ultrathink) | ➖ |
| Custom provider definitions | ☑️ (config) | ☑️ (plugin) | ☑️ | ➖ |
| Per-session model override | ☑️ | ☑️ | ☑️ | ➖ |
| 1Password integration | ➖ | ➖ | ☑️ (extension) | ➖ |
| Vault integration | ➖ | ➖ | ☑️ (extension) | ➖ |
| Credential obfuscation | ➖ | ➖ | ☑️ | ➖ |
| Usage/cost tracking per provider | ☑️ | ☑️ | ☑️ (per-provider) | 🔶 (estimate) |
| Account pooling | ➖ | ➖ | ☑️ (auth gateway) | ➖ |

## 5. Memory / Context Management

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Context window tracking | ☑️ | ☑️ | ☑️ (native tokens) | ☑️ (TokenCounter) |
| Auto-compaction | ☑️ (summarize + prune) | ☑️ (checkpoints) | ☑️ (4 strategies) | ☑️ (ContextManager) |
| Compaction: branch summarization | ➖ | ➖ | ☑️ | ➖ |
| Compaction: pruning | ☑️ | ☑️ | ☑️ | ☑️ |
| Compaction: shake (strip tool results/images) | ➖ | ➖ | ☑️ | ➖ |
| Compaction: snapcompact (bitmap archival) | ➖ | ➖ | ☑️ (native Rust) | ➖ |
| Compaction: tool protection | ➖ | ➖ | ☑️ | ➖ |
| Session resume | ☑️ | ☑️ | ☑️ | 🔶 (state only) |
| Conversation history persistence | ☑️ (SQLite) | ☑️ (SQLite) | ☑️ (SQLite/Redis) | ☑️ (session memory) |
| Embedding-based recall | ➖ | ☑️ (LanceDB) | ☑️ (Mnemopi vectors) | ➖ |
| Episodic/graph memory | ➖ | ☑️ (memory-core) | ☑️ (episodic-graph) | ➖ |
| Dreaming/consolidation | ➖ | ☑️ | ➖ | ➖ |
| Memory dreaming page | ➖ | ☑️ | ➖ | ➖ |
| Hierarchical memory (project/session/feature) | ➖ | ➖ | ➖ | ☑️ |
| Project-level facts | ➖ | ➖ | ➖ | ☑️ |
| Failure pattern memory | ➖ | ➖ | ➖ | ☑️ |
| Memory recall tool | ➖ | ☑️ (`memory_search`) | ☑️ (`memory_recall`) | ➖ |
| Memory retain tool | ➖ | ☑️ (memory files) | ☑️ (`memory_retain`) | ➖ |
| Memory reflect (synthesize) | ➖ | ➖ | ☑️ | ➖ |
| Memory edit/forget | ➖ | ➖ | ☑️ | ➖ |
| Memory import wizard | ➖ | ☑️ | ➖ | ➖ |
| Memory citations | ➖ | ☑️ | ➖ | ➖ |
| Memory backend resolution (pluggable) | ➖ | ➖ | ☑️ (local/hindsight/mnemopi/off) | ➖ |
| Mental models | ➖ | ➖ | ☑️ (Hindsight) | ➖ |
| Entity extraction / triples store | ➖ | ➖ | ☑️ (Mnemopi) | ➖ |
| Weibull decay / forgetting curve | ➖ | ➖ | ☑️ (Mnemopi) | ➖ |
| Polyphonic recall | ➖ | ➖ | ☑️ (Mnemopi) | ➖ |
| Token counting | ☑️ | ☑️ | ☑️ (tiktoken-rs native) | ☑️ (word*1.3 estimate) |
| Memory MCP server | ➖ | ➖ | ☑️ (Mnemopi 15 tools) | ➖ |
| Append-only context mode | ➖ | ➖ | ☑️ | ➖ |
| Replay policy | ➖ | ➖ | ☑️ | ➖ |

## 6. Permissions & Security

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Ask before destructive ops | ☑️ | ☑️ | ☑️ | ☑️ |
| Auto-deny patterns | ☑️ (deny rules) | ☑️ (deny list) | ☑️ (deny) | ☑️ |
| Auto-approve all (`--yolo`) | ☑️ | ☑️ | ☑️ | ☑️ |
| Protected paths | ☑️ (external_dir) | ☑️ (fs policy) | ☑️ (path sandboxing) | ☑️ |
| Per-tool permission rules | ☑️ | ☑️ (tool policy) | ☑️ (approval.<tool>) | 🔶 (destructive set) |
| Approval persistence (session) | ☑️ (saved) | ☑️ (allowlist) | ☑️ | ➖ |
| Permission hooks | ☑️ (plugin) | ☑️ (before-tool-call) | ☑️ (hooks) | ➖ |
| Subagent permission derivation | ☑️ | ☑️ | ☑️ | ➖ |
| Security audit | ➖ | ☑️ (comprehensive) | ☑️ (vulnerability scanning) | ➖ |
| Secret masking/redaction | ➖ | ☑️ | ☑️ (obfuscator, regex) | ➖ |
| SSRF protection | ➖ | ☑️ | ➖ | ➖ |
| TLS fingerprint pinning | ➖ | ☑️ | ➖ | ➖ |
| Flood guard (unauthorized) | ➖ | ☑️ | ➖ | ➖ |
| Operator approval system | ➖ | ☑️ | ➖ | ➖ |
| Exec approval (iOS push) | ➖ | ☑️ | ➖ | ➖ |
| Device pairing/auth | ➖ | ☑️ | ➖ | ➖ |
| External content wrapping (prompt injection) | ➖ | ☑️ | ➖ | ➖ |
| Dangerous config flags detection | ➖ | ☑️ | ➖ | ➖ |
| Safe regex checking | ➖ | ☑️ | ➖ | ➖ |
| Windows ACL permissions | ➖ | ☑️ | ➖ | ➖ |
| Preauth connection budget | ➖ | ☑️ | ➖ | ➖ |
| Handshake timeouts | ➖ | ☑️ | ➖ | ➖ |
| Origin check | ➖ | ☑️ | ➖ | ➖ |
| Arity checking (bash args) | ☑️ | ➖ | ➖ | ➖ |

## 7. Session Management

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Multi-session | ☑️ | ☑️ | ☑️ | ☑️ |
| Session list | ☑️ | ☑️ | ☑️ | ☑️ |
| Session resume | ☑️ | ☑️ | ☑️ | 🔶 (state only) |
| Session fork | ☑️ (timeline fork) | ☑️ | ☑️ (`--fork`) | ➖ |
| Session share | ☑️ (share URLs) | ☑️ (snapshots) | ☑️ (`omp share`) | ➖ |
| Session export | ☑️ (redacted) | ☑️ (trajectory) | ☑️ (HTML export) | ➖ |
| Session import | ☑️ | ➖ | ☑️ (Claude/Codex import) | ➖ |
| Session branching | ☑️ (parentID) | ☑️ (child sessions) | ☑️ | ➖ |
| Session compaction | ☑️ | ☑️ | ☑️ | ☑️ (ContextManager) |
| Session revert/undo | ☑️ (git-based) | ➖ | ☑️ (checkpoint) | ➖ |
| Custom session ID | ➖ | ➖ | ➖ | ☑️ (`--session-id`) |
| Session metadata | ☑️ | ☑️ | ☑️ | ☑️ (context.json) |
| Session groups | ➖ | ☑️ | ➖ | ➖ |
| Session observer | ➖ | ☑️ | ➖ | ➖ |
| Session companion | ➖ | ☑️ | ➖ | ➖ |
| Session diff (baseline) | ➖ | ☑️ | ➖ | ➖ |
| Session subscriptions | ➖ | ☑️ | ➖ | ➖ |
| Session archive | ➖ | ☑️ | ➖ | ➖ |
| Session upstream monitor | ➖ | ☑️ | ➖ | ➖ |
| Session restart recovery | ➖ | ☑️ | ☑️ (turn recovery) | ➖ |
| Session deletion with cleanup | ☑️ | ☑️ | ☑️ | ➖ |
| Snapcompact inline compaction | ➖ | ➖ | ☑️ | ➖ |
| Snapcompact savings journal | ➖ | ➖ | ☑️ | ➖ |
| Foreign session import (Claude/Codex) | ➖ | ➖ | ☑️ | ➖ |
| Session tree visualization | ➖ | ➖ | ☑️ (`/tree`) | ➖ |
| Session handoff | ➖ | ➖ | ☑️ (`/handoff`) | ➖ |
| Session move to directory | ➖ | ➖ | ☑️ (`/move`) | ➖ |
| Working directory management | ☑️ (worktree) | ☑️ | ☑️ (`/add-dir`, `/remove-dir`) | ➖ |
| Session cost tracking | ☑️ (per-message) | ☑️ (usage buckets) | ☑️ (per-session) | ➖ |
| Session title auto-generation | ☑️ | ☑️ | ☑️ (small model) | ➖ |

## 8. Streaming

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| LLM response streaming | ☑️ | ☑️ | ☑️ | ☑️ |
| Tool call streaming (partial args) | ☑️ | ☑️ | ☑️ | ➖ |
| Streaming text completion hook | ☑️ (plugin) | ➖ | ➖ | ➖ |
| SSE event bridge | ☑️ | ☑️ | ➖ | ➖ |
| WebSocket events | ☑️ (experimental) | ☑️ | ➖ | ➖ |
| Voice/audio streaming | ➖ | ☑️ (TTS streaming) | ☑️ (WebRTC live) | ➖ |
| Block streaming (chunked output) | ➖ | ☑️ | ➖ | ➖ |
| Draft preview streaming | ➖ | ☑️ | ➖ | ➖ |

## 9. Subagents / Tasks

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Spawn subagent | ☑️ (`task`) | ☑️ (`subagents`) | ☑️ (`task`) | 🔶 (SubagentManager) |
| Background tasks | ☑️ (experimental) | ☑️ (detached) | ☑️ (vibe workers) | ➖ |
| Parallel execution | 🔶 | ☑️ (swarm) | ☑️ (parallel) | 🔶 (asyncio stub) |
| Subagent types | ☑️ (explore, general) | ☑️ | ☑️ (scout, designer, reviewer) | ➖ |
| Task cancellation | ☑️ | ☑️ | ☑️ | ➖ |
| Structured output schema | ➖ | ☑️ | ☑️ (`outputSchema`) | ➖ |
| Task persistence/revive | ➖ | ➖ | ☑️ (persisted-revive) | ➖ |
| Isolation worktrees | ➖ | ➖ | ☑️ (`task.isolation`) | ➖ |
| Task flow registry | ➖ | ☑️ (taskflow) | ➖ | ➖ |
| Detached task runtime | ➖ | ☑️ | ➖ | ➖ |
| Subagent depth limits | ➖ | ☑️ | ➖ | ➖ |
| Completion delivery/announce | ➖ | ☑️ | ➖ | ➖ |
| Yield tool (schema validation) | ➖ | ➖ | ☑️ | ➖ |
| Spawn policy / read-only policy | ➖ | ➖ | ☑️ | ➖ |
| Provider concurrency for tasks | ➖ | ➖ | ☑️ | ➖ |
| Output manager for subagents | ➖ | ➖ | ☑️ | ➖ |

## 10. Diff / Editing

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Search/replace edit | ☑️ (cline/gemini-style) | ☑️ (exact replace) | ☑️ (hashline) | ☑️ |
| Full file write | ☑️ | ☑️ | ☑️ | ☑️ |
| Unified diff patch (V4A) | ☑️ (GPT-5) | ☑️ | ☑️ (apply_patch mode) | ➖ |
| Line-anchored patches (hashline) | ➖ | ➖ | ☑️ | ➖ |
| AST-based edit | ➖ | ➖ | ☑️ (ast_edit) | ➖ |
| Diff preview | ☑️ | ☑️ | ☑️ | ➖ |
| Unified diff generation | ☑️ | ☑️ | ☑️ (native Rust) | ➖ |
| Multi-file edit | ☑️ | ☑️ | ☑️ | ☑️ (sequential) |
| Edit clipboard (cut/paste) | ➖ | ➖ | ☑️ | ➖ |
| Noop loop guard | ➖ | ➖ | ☑️ | ➖ |
| Conflict detection | ➖ | ➖ | ☑️ | ➖ |
| BOM handling | ☑️ | ➖ | ☑️ | ➖ |
| Line-ending preservation | ☑️ | ➖ | ☑️ | ➖ |
| Streaming edit preview | ➖ | ➖ | ☑️ | ➖ |
| File snapshot store | ➖ | ➖ | ☑️ | ➖ |
| Cross-device dispatch | ➖ | ➖ | ☑️ | ➖ |
| Shebang chmod | ➖ | ➖ | ☑️ | ➖ |
| Archive writing | ➖ | ➖ | ☑️ | ➖ |

## 11. Search

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| grep (content search) | ☑️ (ripgrep) | ☑️ | ☑️ (native Rust) | ☑️ |
| glob (file pattern) | ☑️ (ripgrep) | ☑️ (`find`) | ☑️ (native Rust) | ☑️ |
| AST grep (structural) | ➖ | ➖ | ☑️ (native ast-grep) | ➖ |
| Fuzzy file find | ➖ | ➖ | ☑️ (native) | ➖ |
| Semantic search (embeddings) | ➖ | ➖ | ☑️ | ➖ |
| Web search | ☑️ (Exa/Parallel) | ☑️ (7+ providers) | ☑️ (20+ providers) | ➖ |
| Web fetch | ☑️ | ☑️ | ☑️ | ➖ |
| Code summary (tree-sitter) | ➖ | ➖ | ☑️ (native) | ➖ |
| LSP symbol search | ☑️ (experimental) | ➖ | ☑️ | ➖ |
| 55+ language grammars (tree-sitter) | ➖ | ➖ | ☑️ | ➖ |
| 60+ domain scrapers | ➖ | ➖ | ☑️ | ➖ |
| Multi-path search | ➖ | ➖ | ☑️ | ➖ |
| Internal URL search | ➖ | ➖ | ☑️ (archive search) | ➖ |

## 12. Hooks / Events

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Plugin hooks | ☑️ (9 hook types) | ☑️ | ☑️ (hooks system) | ➖ |
| Event bus | ☑️ | ☑️ | ☑️ | ➖ |
| Lifecycle events | ☑️ | ☑️ | ☑️ | ➖ |
| Before/after tool hooks | ☑️ | ☑️ | ☑️ | ➖ |
| Session events | ☑️ | ☑️ | ☑️ | ☑️ (status.json) |
| Audit events | ➖ | ☑️ | ➖ | ➖ |
| Trace recording | ☑️ | ☑️ (trajectory) | ☑️ | ☑️ (JSONL traces) |
| Gmail watcher hook | ➖ | ☑️ | ➖ | ➖ |
| Hook package install | ➖ | ☑️ | ➖ | ➖ |
| Hook fire-and-forget | ➖ | ☑️ | ➖ | ➖ |
| Session auto-reset hook | ➖ | ☑️ | ➖ | ➖ |
| File-trigger hooks | ➖ | ➖ | ☑️ | ➖ |
| Git-checkpoint hooks | ➖ | ➖ | ☑️ | ➖ |
| Permission-gate hooks | ➖ | ➖ | ☑️ | ➖ |
| Dirty-repo-guard hooks | ➖ | ➖ | ☑️ | ➖ |
| Auto-commit-on-exit hooks | ➖ | ➖ | ☑️ | ➖ |
| Custom compaction hooks | ➖ | ➖ | ☑️ | ➖ |
| Status-line hooks | ➖ | ➖ | ☑️ | ➖ |
| Q&A hooks | ➖ | ➖ | ☑️ | ➖ |
| Protected-paths hooks | ➖ | ➖ | ☑️ | ➖ |

## 13. Skills / Plugins / Extensions

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Skill system | ☑️ (`skill` tool) | ☑️ (`skills`) | ☑️ (`skill://`) | 🔶 (find_skills stub) |
| Skill discovery | ☑️ (remote + local) | ☑️ (ClawHub) | ☑️ | ➖ |
| Skill loading (SKILL.md) | ☑️ | ☑️ | ☑️ | 🔶 (npx skills) |
| Plugin system | ☑️ | ☑️ | ☑️ | ➖ |
| Plugin marketplace | ➖ | ☑️ (ClawHub) | ☑️ (marketplace) | ➖ |
| Plugin install | ☑️ (npm/git) | ☑️ (npm/git/archive) | ☑️ (git/local/marketplace) | ➖ |
| Plugin security scanning | ➖ | ☑️ | ➖ | ➖ |
| Custom agents via config | ☑️ | ☑️ | ☑️ (agent plugins) | ➖ |
| Custom tools via config | ➖ | ➖ | ☑️ (`.omp/tools/`) | ➖ |
| Custom commands | ➖ | ➖ | ☑️ | ➖ |
| Autolearn skills (auto-create) | ➖ | ➖ | ☑️ | ➖ |
| Skill workshop (proposals) | ➖ | ☑️ | ➖ | ➖ |
| Skill curator (pin/archive) | ➖ | ☑️ | ➖ | ➖ |
| Skill environment overrides | ➖ | ☑️ | ➖ | ➖ |
| Extension API | ☑️ (plugin SDK) | ☑️ (plugin SDK) | ☑️ (ExtensionAPI) | ➖ |
| Plugin state store | ➖ | ☑️ (SQLite per-plugin) | ➖ | ➖ |
| Plugin HTTP routes | ➖ | ☑️ | ➖ | ➖ |
| Plugin lifecycle trace | ➖ | ☑️ | ➖ | ➖ |
| Tool proxy (intercept calls) | ➖ | ➖ | ☑️ | ➖ |

## 14. MCP (Model Context Protocol)

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| MCP client | ☑️ | ☑️ | ☑️ | ☑️ |
| stdio transport | ☑️ | ☑️ | ☑️ | ☑️ |
| HTTP transport | ☑️ (Streamable) | ☑️ | ☑️ | ➖ |
| SSE transport | ☑️ | ☑️ | ☑️ (deprecated) | ➖ |
| OAuth for MCP | ☑️ | ☑️ | ☑️ | ➖ |
| MCP tool auto-registration | ☑️ | ☑️ | ☑️ | ☑️ |
| MCP CLI manage | ☑️ | ☑️ | ☑️ | ➖ |
| Smithery integration | ➖ | ➖ | ☑️ | ➖ |
| MCP server (expose tools) | ➖ | ☑️ (channels + tools) | ☑️ (Mnemopi) | ➖ |
| MCP resource browsing | ☑️ (list, templates, read) | ➖ | ☑️ | ➖ |
| MCP resource attachments (PDF, images) | ☑️ (10MB) | ➖ | ☑️ | ➖ |
| MCP app channel | ➖ | ☑️ | ➖ | ➖ |
| MCP grant store | ➖ | ☑️ | ➖ | ➖ |
| MCP roots capability | ☑️ | ➖ | ☑️ | ➖ |
| MCP logging notifications | ☑️ | ➖ | ☑️ | ➖ |
| MCP tool bridge | ➖ | ➖ | ☑️ | ☑️ |
| MCP tool cache | ➖ | ➖ | ☑️ | ➖ |
| MCP reconnection | ➖ | ➖ | ☑️ | ➖ |
| MCP subscription actions | ➖ | ➖ | ☑️ | ➖ |

## 15. Git Integration

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
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
| Agentic commit (AI message) | ➖ | ➖ | ☑️ (map-reduce pipeline) | ➖ |
| Changelog generation | ➖ | ➖ | ☑️ | ➖ |
| Split-commit support | ➖ | ➖ | ☑️ | ➖ |
| Lock-file pairing | ➖ | ➖ | ☑️ | ➖ |
| Topological sort (commits) | ➖ | ➖ | ☑️ | ➖ |

## 16. Configuration

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| JSON/JSONC config file | ☑️ (`opencode.json`) | ☑️ (`openclaw.json`) | ☑️ (settings) | ➖ |
| Env vars | ☑️ (50+) | ☑️ | ☑️ (115+) | ☑️ (15+) |
| Per-project config | ☑️ (`.opencode/`) | ☑️ | ☑️ (`.omp/`) | ➖ |
| Global config | ☑️ (`~/.config/opencode/`) | ☑️ | ☑️ | ➖ |
| AGENTS.md support | ☑️ | ☑️ | ☑️ | ☑️ |
| CLAUDE.md support | ☑️ | ☑️ | ☑️ (import) | ➖ |
| Variable substitution | ☑️ (`{env:}`, `{file:}`) | ➖ | ☑️ | ➖ |
| Remote config | ☑️ (well-known) | ➖ | ➖ | ➖ |
| Config validation | ☑️ | ☑️ (`config validate`) | ☑️ | ➖ |
| Config migration | ☑️ (V1→V2) | ☑️ (doctor) | ☑️ | ➖ |
| Profile support | ➖ | ☑️ (`--profile`) | ☑️ (`--profile`) | ➖ |
| Config watching (hot reload) | ☑️ | ☑️ (reload plans) | ➖ | ➖ |
| Managed preferences (MDM) | ☑️ | ➖ | ➖ | ➖ |
| Markdown config (frontmatter) | ☑️ | ➖ | ☑️ | ➖ |
| Config diff | ➖ | ☑️ | ➖ | ➖ |
| Config redaction | ➖ | ☑️ | ➖ | ➖ |
| Machine-level state | ➖ | ☑️ | ➖ | ➖ |
| Config schema (Zod) | ☑️ | ☑️ | ☑️ | ➖ |
| Config backup rotation | ➖ | ☑️ | ➖ | ➖ |

## 17. TUI / UI

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
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
| Web UI | ☑️ | ☑️ (Control UI, 24 langs) | ☑️ (rpc-ui) | ➖ |
| Desktop app | ☑️ (Electron) | ➖ | ➖ | ➖ |
| Mobile companion | ➖ | ☑️ (nodes) | ➖ | ➖ |
| Watch dashboard | ➖ | ☑️ | ☑️ (stats dashboard) | ☑️ |
| Mermaid rendering | ➖ | ➖ | ☑️ | ➖ |
| LaTeX rendering | ➖ | ➖ | ☑️ (LaTeX-to-Unicode) | ➖ |
| Mouse support | ☑️ | ➖ | ☑️ | ☑️ |
| Kitty keyboard protocol | ➖ | ➖ | ☑️ | ➖ |
| tmux integration | ➖ | ➖ | ☑️ | ➖ |
| Setup wizard | ☑️ | ☑️ (wizard) | ☑️ (setup-wizard) | ➖ |
| Status line (git, context, model) | ➖ | ➖ | ☑️ | ➖ |
| Slash command autocomplete | ☑️ | ☑️ | ☑️ | ➖ |
| Emoji autocomplete | ➖ | ➖ | ☑️ | ➖ |
| GitHub ref autocomplete | ➖ | ➖ | ☑️ | ➖ |
| Internal URL autocomplete | ➖ | ➖ | ☑️ | ➖ |
| Plan review overlay | ➖ | ➖ | ☑️ | ➖ |
| Pause screen | ➖ | ➖ | ☑️ | ➖ |
| Stash dialog | ☑️ | ➖ | ➖ | ➖ |
| Timeline/fork dialog | ☑️ | ➖ | ➖ | ➖ |
| Permission prompt UI | ☑️ | ➖ | ☑️ | ☑️ |
| Background pulse indicator | ☑️ | ➖ | ➖ | ➖ |
| Lobster pet mascot | ➖ | ☑️ | ➖ | ➖ |
| Confetti | ➖ | ☑️ | ➖ | ➖ |
| Custom themes with transitions | ➖ | ☑️ | ☑️ | ➖ |
| Web push notifications | ➖ | ☑️ | ➖ | ➖ |
| Onboarding mode | ➖ | ☑️ | ➖ | ➖ |

## 18. Monitoring / Observability

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Structured logging | ☑️ (file logger) | ☑️ | ☑️ | ☑️ (traces JSONL) |
| OpenTelemetry (OTLP) | ☑️ (experimental) | ☑️ (OTel extension) | ☑️ | ➖ |
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
| Emission guards | ➖ | ➖ | ☑️ | ➖ |
| Transcript recorder | ➖ | ➖ | ☑️ | ➖ |

## 19. Gateway / Remote / Infrastructure

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| WebSocket gateway | ➖ | ☑️ | ➖ | ➖ |
| Remote agent connection | ☑️ (`attach`) | ☑️ | ➖ | ➖ |
| Daemon service | ➖ | ☑️ (launchd/systemd/schtasks) | ➖ | ➖ |
| Fleet management | ➖ | ☑️ (Docker/Podman) | ➖ | ➖ |
| Node host (headless) | ➖ | ☑️ (Android/iOS/macOS) | ➖ | ➖ |
| Worker runtime (remote inference) | ➖ | ☑️ (workspace rsync) | ➖ | ➖ |
| mDNS/Bonjour discovery | ☑️ (experimental) | ☑️ | ➖ | ➖ |
| DNS/Tailscale binding | ➖ | ☑️ | ➖ | ➖ |
| Proxy capture (test fixtures) | ➖ | ☑️ | ➖ | ➖ |
| Collab/live sessions | ➖ | ➖ | ☑️ (E2E encrypted) | ➖ |
| Hot reload (config changes) | ☑️ (config watcher) | ☑️ (reload plans) | ➖ | ➖ |
| Graceful shutdown | ➖ | ☑️ (session tracking) | ➖ | ➖ |
| Startup trace | ☑️ | ☑️ | ➖ | ➖ |
| Container orchestration | ➖ | ☑️ (fleet) | ☑️ (RoboMP sandbox) | ➖ |
| Dockerfile included | ➖ | ☑️ | ☑️ (multi-stage, RoboMP) | ➖ |
| Snapshot/backup system | ➖ | ☑️ | ➖ | ➖ |
| Worker workspace sync | ➖ | ☑️ (rsync, reconcile) | ➖ | ➖ |
| RFB/VNC view-only filter | ➖ | ☑️ | ➖ | ➖ |
| Desktop observe/tunnel | ➖ | ☑️ | ➖ | ➖ |

## 20. Channels & Messaging

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Multi-channel messaging | ➖ (Slack only) | ☑️ (Discord, Telegram, WhatsApp, Slack, Nostr, Synology, Teams, IRC, 10+ more) | ➖ | ➖ |
| Channel plugin system | ➖ | ☑️ | ➖ | ➖ |
| Thread bindings | ➖ | ☑️ | ➖ | ➖ |
| Typing indicators | ➖ | ☑️ | ➖ | ➖ |
| Mention gating | ➖ | ☑️ | ➖ | ➖ |
| Allowlist/denylist (wildcard, id, name, tag) | ➖ | ☑️ | ➖ | ➖ |
| DM policy | ➖ | ☑️ | ➖ | ➖ |
| Inbound debounce | ➖ | ☑️ | ➖ | ➖ |
| Status reactions | ➖ | ☑️ | ➖ | ➖ |
| Channel health monitor | ➖ | ☑️ | ➖ | ➖ |
| Channel streaming (block/draft/progress) | ➖ | ☑️ | ➖ | ➖ |
| Sender labels | ➖ | ☑️ | ➖ | ➖ |
| Conversation resolution | ➖ | ☑️ | ➖ | ➖ |
| Polls | ➖ | ☑️ | ➖ | ➖ |
| Link understanding | ➖ | ☑️ | ➖ | ➖ |

## 21. Voice / Audio / Media

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Realtime voice sessions | ➖ | ☑️ (provider-backed) | ☑️ (WebRTC) | ➖ |
| TTS (text-to-speech) | ➖ | ☑️ (provider-backed, streaming) | ☑️ (Kokoro local, xAI Grok) | ➖ |
| STT (speech-to-text) | ➖ | ☑️ (Deepgram, realtime) | ☑️ (Sherpa runtime) | ➖ |
| Voice barge-in / marks | ➖ | ☑️ | ➖ | ➖ |
| Meeting bot | ➖ | ☑️ (Google Meet/Zoom/Teams) | ➖ | ➖ |
| Audio codec / energy detection | ➖ | ☑️ | ➖ | ➖ |
| Audio transcoding (mulaw) | ➖ | ☑️ | ➖ | ➖ |
| Microphone capture | ➖ | ➖ | ☑️ (native Rust) | ➖ |
| Speaker playback | ➖ | ➖ | ☑️ (native Rust) | ➖ |
| Opus codec | ➖ | ➖ | ☑️ (native Rust) | ➖ |
| Speech enhancer | ➖ | ➖ | ☑️ | ➖ |
| TTSR (TTS relay) | ➖ | ➖ | ☑️ | ➖ |
| Image generation | ➖ | ☑️ (provider-backed) | ☑️ (Gemini/OpenAI/xAI) | ➖ |
| Music generation | ➖ | ☑️ (provider-backed) | ➖ | ➖ |
| Video generation | ➖ | ☑️ (provider-backed) | ➖ | ➖ |
| Image understanding | ☑️ (attachment normalization) | ☑️ | ☑️ (`inspect_image`) | ➖ |
| Audio transcription | ➖ | ☑️ | ➖ | ➖ |
| Video understanding | ➖ | ☑️ | ➖ | ➖ |
| PDF extraction | ➖ | ☑️ (`pdf`) | ☑️ (Markit: PDF/DOCX/EPUB/PPTX/XLSX) | ➖ |
| QR code generation | ➖ | ☑️ | ➖ | ➖ |
| FFmpeg execution | ➖ | ☑️ | ➖ | ➖ |
| Structured extraction (files) | ➖ | ☑️ | ➖ | ➖ |
| SIXEL terminal image rendering | ➖ | ➖ | ☑️ (native) | ➖ |
| Kitty graphics terminal image | ➖ | ➖ | ☑️ (native) | ➖ |

## 22. Slash Commands

| Feature | OpenCode | OpenClaw | Oh My Pi | Spiral |
|---------|:--------:|:--------:|:-------:|:------:|
| Custom slash commands | ☑️ (config) | ☑️ (auto-reply) | ☑️ (file-based) | ☑️ (built-in only) |
| Commands from MCP prompts | ☑️ | ➖ | ☑️ | ➖ |
| Commands from skills | ☑️ | ☑️ | ☑️ | ➖ |
| Template variables ($1, $ARGUMENTS) | ☑️ | ☑️ | ☑️ | ➖ |
| Agent/model per command | ☑️ | ☑️ | ☑️ | ➖ |
| Subtask/background mode | ☑️ | ➖ | ☑️ | ➖ |
| Built-in `/init` | ☑️ | ➖ | ➖ | ☑️ (`spiral init`) |
| Built-in `/review` | ☑️ | ➖ | ☑️ | ➖ |
| Total slash commands | ~10 | ~20 | 80+ | 12 |

### Oh My Pi Slash Commands (unique)

| Command | Purpose |
|---------|---------|
| `/plan`, `/plan-review` | Plan mode toggle + review |
| `/vibe` | Multi-agent worker mode |
| `/goal`, `/guided-goal` | Goal management |
| `/loop`, `/queue` | Loop/queue modes |
| `/model`, `/switch`, `/fast` | Model selection |
| `/computer`, `/vision`, `/prewalk` | Mode toggles |
| `/security` | Security scan management |
| `/session`, `/new`, `/fresh`, `/clear`, `/drop` | Session lifecycle |
| `/compact`, `/shake` | Compaction control |
| `/handoff`, `/resume`, `/rename`, `/move` | Session operations |
| `/branch`, `/fork`, `/tree` | Session tree |
| `/jobs`, `/usage`, `/stats` | Job/usage stats |
| `/todo` | Todo management |
| `/login`, `/logout` | Provider auth |
| `/mcp` | MCP management |
| `/force`, `/live`, `/pause`, `/quit` | Control |
| `/ssh`, `/btw`, `/tan`, `/omfg` | Misc utilities |
| `/retry`, `/debug` | Debug/retry |
| `/memory` | Memory management |
| `/advisor` | Advisor config |
| `/export`, `/dump`, `/share`, `/collab`, `/join` | Collaboration/export |
| `/install` | Plugin marketplace |
| `/tools`, `/context`, `/extensions`, `/agents` | Tool/agent info |
| `/changelog`, `/hotkeys` | Info |
| `/settings`, `/setup` | Configuration |
| `/add-dir`, `/remove-dir`, `/dirs` | Working dirs |

## 23. Unique to Each Harness

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
| Hot reload with reload plans | Config changes trigger hot/restart plans |
| Gateway server with WebSocket RPC | Full HTTP + WebSocket gateway |
| Operator approval system | Authorization with iOS push delivery |
| Exec approval system | Command approval with timeout and manager |
| Device pairing | Bluetooth/QR pairing with auto-approve |
| Audit system | Recorder, event store, identity resolution |
| Task flow registry | Coordinated multi-step task orchestration |
| Auto-reply command system | Trigger handling, templating, heartbeat |
| Control UI (24+ pages) | Full web UI with chat, sessions, config, skills, plugins, channels, devices, cron, tasks, usage, workboard, apps, logs, dashboards, debug, browser panel, terminal panel, command palette, mascot, confetti |
| Context engine | Delegate, init, registry, quarantine health, runtime settings |
| Pairing system | Setup codes, LAN/Tailscale URL resolution, bootstrap tokens |
| Package lifecycle (Claws) | Bootstrap, config removal, MCP removal, workspace update |
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
| Heap snapshots | V8 heap snapshot generation |
| LSP as agent tool | Experimental LSP tool for agent to use |
| models.dev registry integration | Fetch model metadata from models.dev |
| Structured output (force JSON schema) | Force tool call for final response with schema validation |
| Control plane / multi-workspace | Workspace creation, listing, session moving, adapter runtimes |
| Account/Console integration | Device code auth, multi-account, org switching, remote config sync |
| SDK & client libraries | Auto-generated TypeScript SDK from OpenAPI spec |
| DB query shell | `opencode db` SQLite shell |
| Config migration (V1→V2) | Automatic config version migration |
| Nix flake | Nix package manager support |
| Tool output truncation | Per-agent truncation limits with progressive strategies |
| Ambient instructions & references | External context directories/repos as silent context |
| Filesystem watching | `.gitignore`-aware file watching |
| Worktree name generation | AI-assisted worktree naming |
| Attachment normalization | Photon WASM image resizing, JPEG quality ladder |
| Session sharing (opncd.ai) | Public share URLs with incremental sync |
| System prompt engineering | Model-specific prompts for GPT, Claude, Gemini, Codex, Kimi, etc. |

### Only in Oh My Pi

| Feature | Description |
|---------|-------------|
| Native Rust acceleration | grep, glob, AST, shell, clipboard, desktop, voice, image, snapcompact, tokens |
| 60+ site-specific web scrapers | GitHub, arXiv, Reddit, YouTube, npm, PyPI, MDN, etc. |
| Multi-language eval (Python/JS/Ruby/Julia) | Persistent kernels with streaming output |
| Browser automation | Headless, CMUX, ARIA snapshots, browser relay, screenshot |
| Desktop automation | Screenshot, mouse, keyboard via native OS APIs |
| Snapcompact (bitmap compaction) | Archive context as PNG frames vision models read back |
| AST-level code editing | Structural code editing via Rust AST engine |
| AST grep | AST pattern search and replace |
| Vibe mode (multi-agent) | Spawn/send/wait/kill/list persistent worker sessions |
| Goals system | Persistent, budgeted goal tracking |
| Autoresearch | Automated experiments with git branch management |
| Cleanse (auto-repair) | Diagnostic-driven bounded repair agents |
| Agentic commit | AI commit messages via map-reduce, split-commit, changelog |
| Hub (agent coordination) | IRC bus, peer messaging, process supervision |
| Internal URL protocols (15+) | omp://, agent://, artifact://, memory://, security://, etc. |
| Output minimizer | Per-tool noise reduction with 70+ filters |
| Cross-platform isolation (CoW) | APFS, OverlayFS, Btrfs, ZFS, FICLONE, ProjFS, Rcopy |
| Mnemopi (full memory system) | Vector index, episodic graph, entities, triples, beam search, polyphonic recall, Weibull decay |
| Hindsight memory backend | Bank, mental models, transcript, retention cache |
| Autolearn (auto skill creation) | Learn from sessions, create/enhance managed skills |
| 80+ shell builtins | bash-compatible shell with 80+ builtins + coreutils |
| Security scanning with SARIF | SARIF import/export, seeded repo, finding validation |
| Discovery (multi-harness import) | Import config from Claude, Codex, Cursor, Gemini, Windsurf, etc. |
| Live collaboration (E2E encrypted) | AES-256-GCM, relay server, guest replication |
| Stats dashboard (web UI) | Overview, costs, models, providers, tools, behavior, errors |
| Metaharness (benchmarks) | Harbor benchmark runner with live dashboard |
| RoboMP (GitHub automation) | Python webhook-driven issue/PR worker with sandbox |
| DAP debugger | Breakpoints, variables, stack traces, disassembly, profiling |
| Checkpoint/rewind | Save investigation checkpoints and rewind to them |
| Markit (document conversion) | PDF, DOCX, EPUB, PPTX, XLSX → markdown |
| Hashline (line-anchored edits) | Hash-based line identification, block resolution, streaming |
| Omptype (schema validation) | ArkType-compatible JIT runtime, JSON Schema emission |
| Wire protocol | Shared JSON protocol for collab live sessions |
| Advisor/watchdog | Watchdog, emission guards, transcript recorder |
| 80+ slash commands | Modes, sessions, lifecycle, collaboration, marketplace |
| Orchestrate keyword | Typing "orchestrate" triggers multi-agent mode |
| Magic keywords | Special input keywords (orchestrate, ultrathink) |
| RPC mode | Remote procedure call for programmatic control |
| Custom tool loader | Dynamically load custom tools from extensions/files |
| Custom commands (file-based) | Define slash commands from `.md` files |
| Hook examples library | auto-commit, confirm-destructive, dirty-repo-guard, etc. |
| Plugin marketplace | Git URL, local path, marketplace install |
| Provider dialects (12+) | Anthropic, Gemini, GLM, Kimi, MiniMax, Qwen3, DeepSeek, etc. |
| Auth gateway (account pooling) | HTTP gateway for routing AI provider requests |
| Codex auto-reset | Automatic rate-limit reset for OpenAI Codex |
| Credential pin | Credential pinning for provider auth |
| Provider image budget | Per-provider image attachment budget management |
| TTSR (TTS relay) | Streaming TTS to external clients |
| Pause gate | Process-global pause control |
| Replay policy | Controls which messages replayed on resume |
| Foreign session import | Claude and Codex session import |
| Codex security import | Import Codex Security cloud scan results |
| Title generator (small model) | Auto-generate session titles using small models |
| Model discovery (auto) | Discover from Antigravity, Codex, Cursor, Devin, Gemini, etc. |
| Model identity (family classification) | Family, dialect, priority, markers |
| pi-shell (bash-compatible) | 80+ builtins, coreutils, output minimizer |
| pi-voice (native) | CoreAudio, WASAPI, ALSA/PulseAudio backends |
| pi-iso (isolation PAL) | 8 copy-on-write backends |
| pi-natives (N-API) | 30+ native modules |

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
| Project-level facts | Store facts at project level |
| Failure pattern memory | Remember failure patterns |
| Live rate/ETA | Real-time rate and ETA in watch dashboard |
| Loop phase tracking | Track loop phases via status.json |
| Custom session IDs | `--session-id` for explicit session identification |
| Built-in slash commands | `/help /exit /clear /mode /model /sessions /new /reset /abort /status /usage /verbose /tools` |
| TUI with Ink (React for terminals) | Interactive chat interface built with Ink/React |
| Process timing per loop | Per-feature, per-loop (agent/verifier/engine) timing breakdown |
| 5 agent modes | normal, plan, bypass, safe, interactive |

---

## Grand Summary

| Dimension | OpenCode | OpenClaw | Oh My Pi | Spiral |
|-----------|:--------:|:--------:|:-------:|:------:|
| **CLI Commands** | 28 | 45+ | 35 | 8 |
| **Agent Modes** | 5 | 8 | 12+ | 5 |
| **Built-in Tools** | 15 | 40+ | 30+ | 18 |
| **LLM Providers** | ~25 | ~60+ | ~75+ | 3 |
| **Memory Features** | 7 | 9 | 9+ | 6 |
| **Permission/Security Features** | 8 | 17+ | 10+ | 5 |
| **TUI Features** | 14 | 14 | 18+ | 8 |
| **Config Features** | 10 | 10 | 10 | 3 |
| **MCP Features** | 7 | 8 | 8+ | 4 |
| **Git Features** | 7 | 4 | 5+ | 6 |
| **Session Features** | 10 | 11 | 15+ | 5 |
| **Streaming Features** | 5 | 6 | 6 | 1 |
| **Subagent/Task Features** | 6 | 7 | 8+ | 1 |
| **Diff/Edit Features** | 9 | 7 | 11+ | 4 |
| **Search Features** | 7 | 7 | 10+ | 2 |
| **Hook/Event Features** | 6 | 6 | 10+ | 1 |
| **Skill/Plugin Features** | 8 | 8 | 10+ | 1 |
| **Monitoring Features** | 8 | 9 | 10+ | 5 |
| **Auth Features** | 7 | 8 | 10+ | 1 |
| **Gateway/Remote** | 4 | 9 | 2 | 0 |
| **Channel Features** | 1 | 15+ | 0 | 0 |
| **Voice/Media Features** | 1 | 10+ | 12+ | 0 |
| **Slash Commands** | ~10 | ~20 | 80+ | 12 |
| **Unique Features** | 2 | 4 | 8+ | 9 |

### Key Takeaways

**OpenClaw** — The most feature-complete harness. Best for always-on personal assistant across many communication channels. Richest channel system (15+ platforms), meeting bot, voice sessions, fleet/daemon management, security infrastructure, 24-language UI, ClawHub marketplace.

**OpenCode** — Best for IDE-integrated coding. Cleanest config system, ACP/VS Code integration, git-based revert, plan/build workflow, GitHub App agent, 9 code formatters, models.dev registry, enterprise features, OpenAPI spec generation, control plane.

**Oh My Pi** — Most technically advanced and broadest tool surface. Native Rust acceleration, 75+ providers, 60+ scrapers, 20+ search providers, multi-language eval, browser/desktop automation, snapcompact compaction, Mnemopi memory, vibe mode, goals, autoresearch, cleanse, agentic commit, hub, 80+ slash commands, live collab, DAP debugger, security scanning, cross-platform isolation.

**Spiral** — Smallest feature surface but most autonomous. Unique 4-loop architecture (agent→verifier→event→engine), ADR-driven autonomy, self-improving meta-loop, hierarchical memory with failure patterns, forever mode, built-in test/lint tools. Focused on self-improving autonomous coding rather than interactive assistance.