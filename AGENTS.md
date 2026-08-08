# AGENTS.md

## Domain Knowledge
Domain knowledge lives in the `docs/` directory. Read relevant files there before implementing features.

## Project Overview
Spiral is an AI co-founder harness powered by LangChain's hill climbing loop architecture.
It reads an ADR, extracts features, and implements them through 4 nested loops.

## Architecture
4 nested loops drive implementation:
1. **Agent Loop** — Implements features using tool calls
2. **Verification Loop** — Grades implementations and retries on failure
3. **Event Loop** — Orchestrates feature execution from ADR
4. **Engine Analysis Loop** — Meta-analysis of traces to improve prompts/rubrics

## Build / Dev / Test Commands
- `just install` — install deps
- `just test` — run pytest with coverage
- `just lint` — run ruff check
- `just fmt` — run ruff format
- `just run` — run once
- `just forever` — run continuously

## Key Conventions
- Type hints everywhere
- Pydantic dataclasses for models
- `from __future__ import annotations` in every Python file
- Coverage enforced at 80%
- Use `just` for task running (not `make`)
