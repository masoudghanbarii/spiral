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

# Or run directly
npx spiral sessions

# Configure
export SPIRAL_OLLAMA_API_KEY=your-key
export SPIRAL_PROJECT_DIR=/path/to/your-project

# Run
spiral run         # One pass through all features
spiral forever     # Continuous loop (Ctrl+C to stop)
spiral init        # Parse ADR, show feature list
spiral reset       # Clear state, start fresh
spiral watch       # Live dashboard
spiral sessions    # List all sessions
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