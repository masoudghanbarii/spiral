# Contributing to Spiral

Thanks for your interest in contributing! Spiral is an AI co-founder harness built for agents and loops.

## Quick Links

- **GitHub:** https://github.com/masoudghanbarii/spiral
- **Discussions:** https://github.com/masoudghanbarii/spiral/discussions
- **Issues:** https://github.com/masoudghanbarii/spiral/issues

## How to Contribute

1. **Bugs & small fixes** → Open a PR directly
2. **New features** → Open an issue first to discuss the approach
3. **Refactor-only PRs** → Don't open a PR unless a maintainer explicitly asks for it
4. **Questions** → Open a [GitHub Discussion](https://github.com/masoudghanbarii/spiral/discussions)

## Before You PR

- Run `npm run typecheck` — must pass with no errors
- Run `npm test` — all 344 tests must pass
- Run `npm run build` — must compile cleanly
- Keep PRs focused (one thing per PR)
- Describe what & why in the PR body
- Include screenshots for TUI/visual changes
- Use American English spelling in code, comments, and docs

## Development Setup

```bash
git clone https://github.com/masoudghanbarii/spiral.git
cd spiral
npm install
npm run build       # TypeScript compile
npm test            # Run test suite
npm run typecheck   # Type-check without emitting
npm run dev         # Run with tsx (no build needed)
```

## Code Style

- TypeScript strict mode
- Type hints everywhere
- Clean async/await for I/O
- No comments unless explaining WHY
- Follow existing naming conventions

## Architecture Overview

Spiral has three main loops:

- **Agent loop** (`src/loops/agent.ts`) — ReAct: model → tools → observe → repeat
- **Verification loop** (`src/loops/verifier.ts`) — grade output, pass/fail, retry with feedback
- **Engine loop** (`src/loops/engine.ts`) — meta-analysis of traces, suggests improvements

The TUI (`src/tui/`) is built with Ink (React for terminals) and supports multi-session workflows with inter-session communication.

## Where to Post What

| Situation | Where |
|---|---|
| Bug, crash, or regression | [GitHub Issue](https://github.com/masoudghanbarii/spiral/issues) |
| Feature idea or proposal | [Discussions: Ideas & Feature Requests](https://github.com/masoudghanbarii/spiral/discussions) |
| Question or help | [Discussions: Q&A](https://github.com/masoudghanbarii/spiral/discussions) |
| Show off your work | [Discussions: Show & Tell](https://github.com/masoudghanbarii/spiral/discussions) |
| Security vulnerability | See [SECURITY.md](SECURITY.md) or private message |

## Reporting Bugs

Use the [issue tracker](https://github.com/masoudghanbarii/spiral/issues). Include:

- Repro steps
- Expected vs actual behavior
- Node.js version, OS, terminal
- Logs or screenshots

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).