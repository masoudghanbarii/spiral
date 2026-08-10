# Spiral — AI Co-founder

Spiral is an autonomous AI co-founder powered by **hill climbing loop architecture**. It reads an Architecture Decision Record (ADR), extracts implementable features, and works through them in a continuous 4-loop harness — implementing, verifying, shipping, and self-improving without stopping.

Named for the spiral — looping upward, evolving with each cycle.

## Architecture: 4 Nested Loops

```
                    ┌─────────────────────────────────────┐
                    │         ENGINE ANALYSIS LOOP         │  (meta)
                    │  Traces → analysis → harness tweaks  │
                    └────────────┬────────────────────────┘
                                 │ feeds back to
                    ┌────────────▼────────────────────────┐
                    │          EVENT LOOP                  │  (outer)
                    │  ADR → features → queue → ship       │
                    └────────────┬────────────────────────┘
                                 │ triggers
                    ┌────────────▼────────────────────────┐
                    │       VERIFICATION LOOP              │  (middle)
                    │  Grade → pass/fail → retry w/feedback│
                    └────────────┬────────────────────────┘
                                 │ wraps
                    ┌────────────▼────────────────────────┐
                    │          AGENT LOOP                 │  (innermost)
                    │  ReAct: model → tools → observe     │
                    └─────────────────────────────────────┘
```

## Quick Start

```bash
# Install globally
npm install -g spiral

# Start the TUI (interactive chat interface)
spiral                    # enters TUI by default
spiral tui                # explicit TUI
spiral chat               # alias for tui

# Autonomous modes
spiral run                # Execute all features once
spiral forever            # Continuous loop (Ctrl+C to stop)
spiral init               # Parse ADR, show feature list
spiral reset              # Clear state, start fresh
spiral watch              # Live dashboard
spiral sessions           # List all sessions
```

## TUI — Terminal User Interface

```bash
spiral                    # enters TUI (default)
spiral tui --message "hello"
spiral chat --session-id my-session
```

The TUI provides an interactive chat interface with the AI agent:

- **Header**: connection state, agent mode, model, session
- **Chat log**: user messages, assistant replies, tool cards, system notices
- **Status line**: running/idle/error, token counts, message count
- **Input**: text editor with history navigation

### Slash Commands

```
/help              Show help
/exit              Exit (Ctrl+D also works)
/clear             Clear conversation
/mode <mode>       Switch: normal|plan|bypass|safe|interactive
/model <model>     Switch LLM model
/sessions          List all sessions
/new               Start fresh session
/reset             Reset session state
/abort             Abort active run (Esc also works)
/status            Show session summary
/usage             Show token usage
/verbose <on|off>  Toggle verbose tool output
/tools             List available tools
/history           Show conversation stats
```

### Keyboard Shortcuts

```
Enter              Send message
Shift+Enter        Insert newline
Ctrl+J             Insert newline
Esc                Abort active run
Ctrl+C             Clear input (press twice to exit)
Ctrl+D             Exit
Ctrl+L             Clear screen
Up/Down            Navigate input history
```

### Local Shell

Prefix with `!` to run a shell command:
```
!ls -la
!git status
!npm test
```

## Agent Modes

```bash
spiral run --behavior plan         # Read-only, outputs implementation plan
spiral run --behavior bypass       # Skip all permission checks
spiral run --behavior safe         # Read-only, no command execution
spiral run --behavior interactive  # User can interject mid-run
spiral run --behavior normal       # Default: ask approval for destructive tools
```

## Multi-Session

```bash
spiral run --session-id auth-feature
spiral run --session-id db-schema
spiral sessions                    # List both
```

## Commands

| Command | Description |
|---------|-------------|
| `spiral run` | Execute all features once |
| `spiral forever` | Run continuously until interrupted |
| `spiral init` | Parse ADR and initialize feature queue |
| `spiral reset` | Clear persisted state |
| `spiral watch` | Live dashboard (rate, ETA, loop phase, LLM latency) |
| `spiral sessions` | List all sessions |
| `spiral run --behavior plan` | Plan mode (read-only) |
| `spiral run --behavior bypass` | Bypass permissions |
| `spiral run --behavior safe` | Safe mode (read-only) |
| `spiral run --behavior interactive` | Interactive mode |

## Configuration

All via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SPIRAL_OLLAMA_API_KEY` | — | Ollama API key |
| `SPIRAL_OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API base URL |
| `SPIRAL_MODEL` | `deepseek-v4-flash:cloud` | LLM model |
| `SPIRAL_PROJECT_DIR` | cwd | Path to target project |
| `SPIRAL_LLM_PROVIDER` | `ollama` | Provider: ollama, anthropic, openai |
| `SPIRAL_AGENT_MODE` | `normal` | Agent mode: normal, plan, bypass, safe, interactive |
| `SPIRAL_AUTO_APPROVE` | `false` | Skip permission checks |
| `SPIRAL_CONTEXT_WINDOW_TOKENS` | `32768` | Context window size for compaction |
| `SPIRAL_MEMORY_DIR` | `<spiral>/memory` | Hierarchical memory root |
| `SPIRAL_STREAM` | `false` | Enable streaming LLM responses |

## Project Structure

```
spiral/
├── src/
│   ├── cli.ts              # CLI entry point (commander)
│   ├── config.ts           # Configuration from env vars
│   ├── harness.ts          # 4-loop orchestrator
│   ├── llm.ts              # LLM client (provider factory)
│   ├── models.ts           # Feature, TraceEntry, GradingResult, HarnessState
│   ├── types.ts            # Shared types
│   ├── modes.ts            # 5 agent behavior modes
│   ├── context.ts          # Token counting + context compaction
│   ├── interactive.ts      # Interactive mode (stdin listener)
│   ├── watch.ts            # Live dashboard
│   ├── providers.ts        # Ollama, Anthropic, OpenAI providers
│   ├── loops/
│   │   ├── agent.ts        # Loop 1: ReAct agent
│   │   ├── verifier.ts     # Loop 2: LLM grader
│   │   ├── event_driver.ts # Loop 3: Feature queue
│   │   └── engine.ts       # Loop 4: Trace analysis
│   ├── managers/
│   │   ├── project.ts      # File/ADR/command operations
│   │   ├── state.ts        # State persistence
│   │   ├── status.ts       # Live status tracking
│   │   ├── traces.ts       # JSONL trace recording
│   │   ├── permissions.ts  # Tool permission system
│   │   ├── git.ts          # Git operations
│   │   └── memory.ts       # Hierarchical memory (project/session/feature)
│   └── tools/
│       └── registry.ts     # 18 tools for agent
├── tests/                  # Vitest test suite
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## License

MIT