# Spiral — AI Co-founder

Spiral is an autonomous AI co-founder powered by LangChain's **hill climbing loop architecture**. It reads an Architecture Decision Record (ADR), extracts implementable features, and works through them in a continuous 4-loop harness — implementing, verifying, shipping, and self-improving without stopping.

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

### Loop 1: Agent Loop (innermost)
Classic ReAct cycle. Model emits actions → invokes tools (read/write files, run tests, lint, ADR updates) → tools return observations → model continues until `FINAL_RESULT`. Implements one feature end-to-end.

### Loop 2: Verification Loop (middle)
LLM-as-judge grader scores the agent's output against a rubric. If it fails, feedback is sent back to the agent loop for retry (up to 3 attempts). Only passing results exit this layer.

### Loop 3: Event Loop (outer)
Parses the ADR into a feature queue. On feature completion, marks the ADR section "Done" and moves to the next feature. When all features are done, re-parses the ADR for new additions. Keeps the live system running.

### Loop 4: Engine Analysis Loop (meta)
Every N features, an analysis agent reviews execution traces and outputs harness improvements — prompt tweaks, rubric changes, tool config updates. Each outer cycle makes the inner loops more effective.

## Traits

- **Long horizon**: Runs until you stop it (`just forever`). When all features done, re-parses ADR for new ones.
- **Project-agnostic**: Point at any project with `SPIRAL_PROJECT_DIR`. Reads ADR + AGENTS.md.
- **Skills-aware**: Calls `find-skills` before implementing (TDD, etc) via `npx skills`.
- **ADR tracking**: Marks sections "Done" after each feature. Updates ADR as new features emerge.
- **Stateful**: Saves/loads `state.json` — survives restarts across sessions.
- **Best practices**: Type hints, async/await, Pydantic models, 80%+ test coverage, standard naming, no comments unless explaining WHY.

## Quick Start

```bash
# Clone
git clone git@github.com:masoudghanbari/spiral.git
cd spiral

# Install
python3 -m venv .venv
.venv/bin/pip install -e .
.venv/bin/pip install pre-commit
.venv/bin/pre-commit install

# Configure
cp .env.example .env
# Edit .env with your Ollama API key and project path

# Run
just run        # One pass through all features
just forever    # Continuous loop (Ctrl+C to stop)
just init       # Parse ADR, show feature list
just reset      # Clear state, start fresh
```

## Commands

| Command | Description |
|---------|-------------|
| `just run` | Execute all features once |
| `just forever` | Run continuously until interrupted |
| `just init` | Parse ADR and initialize feature queue |
| `just reset` | Clear persisted state |
| `just watch` | Live dashboard (rate, ETA, loop phase, LLM latency) |
| `just plan` | Plan mode (read-only, outputs implementation plan) |
| `just bypass` | Bypass all permission checks |
| `just safe` | Safe mode (read-only, no command execution) |
| `just interactive` | Interactive mode (user can interject) |
| `just test` | Run test suite |
| `just lint` | Run ruff linter |
| `just fmt` | Run ruff formatter |

## Configuration

All via environment variables (set in `.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `SPIRAL_OLLAMA_API_KEY` | — | Ollama API key |
| `SPIRAL_OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API base URL |
| `SPIRAL_MODEL` | `deepseek-v4-flash:cloud` | LLM model |
| `SPIRAL_PROJECT_DIR` | — | Path to target project |
| `SPIRAL_MAX_AGENT_ITERATIONS` | `50` | Max ReAct steps per feature |
| `SPIRAL_MAX_VERIFICATION_RETRIES` | `3` | Max verification retries |
| `SPIRAL_ENGINE_ANALYSIS_INTERVAL` | `5` | Engine analysis every N features |
| `SPIRAL_AUTO_APPROVE` | `false` | Skip permission checks |
| `SPIRAL_AGENT_MODE` | `normal` | Agent mode: normal/plan/bypass/safe/interactive |
| `SPIRAL_LLM_PROVIDER` | `ollama` | LLM provider: ollama/anthropic/openai |
| `SPIRAL_STREAM` | `false` | Enable streaming LLM responses |
| `SPIRAL_CONTEXT_WINDOW_TOKENS` | `32768` | Context window size for compaction |
| `SPIRAL_MEMORY_DIR` | `<spiral>/memory` | Hierarchical memory root |

## Project Structure

```
spiral/
├── src/spiral/              # Python package
│   ├── config.py           # Configuration from env vars
│   ├── harness.py          # 4-loop orchestrator
│   ├── llm.py              # Ollama API client
│   ├── models.py           # TraceEntry, GradingResult, Feature, HarnessState
│   ├── main.py             # CLI entry point
│   ├── loops/
│   │   ├── agent.py        # Loop 1: ReAct agent
│   │   ├── verifier.py     # Loop 2: LLM grader
│   │   ├── event_driver.py # Loop 3: Feature queue
│   │   └── engine.py       # Loop 4: Trace analysis
│   ├── managers/
│   │   ├── project.py      # File/ADR/command operations
│   │   ├── state.py        # State persistence
│   │   ├── skills.py       # find-skills integration
│   │   └── traces.py       # JSONL trace recording
│   └── tools/
│       └── registry.py     # 11 tools for agent
├── tests/
│   └── test_core.py        # 11 unit tests
├── justfile                # Task runner
├── pyproject.toml
├── .pre-commit-config.yaml # Ruff lint/format, private key detection
├── .env.example            # Environment template
└── .gitignore
```

## How It Works

1. **Init**: Spiral reads the ADR, uses the LLM to extract all implementable features as a queue.
2. **Agent Loop**: For each feature, the ReAct agent reads context, writes code, runs tests, lints, and marks ADR sections Done.
3. **Verification Loop**: An LLM judge grades the output against a rubric. Failing results get retry feedback.
4. **Event Loop**: Completed features advance the queue. When empty, re-parses ADR for new features.
5. **Engine Loop**: Periodically analyzes execution traces and improves prompts, rubrics, and tool config.

## License

MIT
