# Spiral — AI Co-founder

default:
    just --list

PYTHON := .venv/bin/python

# Run once (all features)
run:
    {{PYTHON}} -m spiral.main --mode run

# Run forever (continuous loop)
forever:
    {{PYTHON}} -m spiral.main --mode forever

# Run in plan mode (read-only, outputs implementation plan)
plan:
    {{PYTHON}} -m spiral.main --mode run --behavior plan

# Run with all permissions bypassed
bypass:
    {{PYTHON}} -m spiral.main --mode run --behavior bypass

# Run in safe mode (read-only, no command execution)
safe:
    {{PYTHON}} -m spiral.main --mode run --behavior safe

# Run in interactive mode (user can interject)
interactive:
    {{PYTHON}} -m spiral.main --mode run --behavior interactive

# Initialize from ADR
init:
    {{PYTHON}} -m spiral.main --mode init

# Reset state
reset:
    {{PYTHON}} -m spiral.main --mode reset

# List all sessions
sessions:
    {{PYTHON}} -m spiral.main --mode sessions

# Watch live dashboard
watch:
    {{PYTHON}} -m spiral.main --mode watch

# Install deps
install:
    {{PYTHON}} -m pip install -e .

# Run tests
test:
    {{PYTHON}} -m pytest tests/ -v --cov=src/spiral --cov-report=term-missing

# Lint
lint:
    {{PYTHON}} -m ruff check src/spiral/ tests/

# Format
fmt:
    {{PYTHON}} -m ruff format src/spiral/ tests/
