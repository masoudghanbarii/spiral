# AGENTS.md

## Project Overview
Spiral is an AI co-founder harness powered by hill climbing loop architecture.
TypeScript rewrite of the original Python implementation.

## Architecture
4 nested loops drive implementation:
1. **Agent Loop** — Implements features using tool calls (ReAct)
2. **Verification Loop** — Grades implementations and retries on failure
3. **Event Loop** — Orchestrates feature execution from ADR
4. **Engine Analysis Loop** — Meta-analysis of traces to improve prompts/rubrics

## Build / Dev / Test Commands
- `npm run dev` — run CLI in dev mode (tsx)
- `npm run build` — compile TypeScript
- `npm test` — run vitest
- `npm run typecheck` — tsc --noEmit
- `npm run format` — prettier write
- `npm run format:check` — prettier check

## Key Conventions
- TypeScript strict mode
- ESM modules (type: "module")
- `import ... from "./x.js"` (explicit .js extensions)
- Vitest for testing
- Prettier for formatting
- No comments unless explaining WHY