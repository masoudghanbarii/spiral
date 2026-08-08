from __future__ import annotations

import time
from typing import Any

from rich.console import Group
from rich.live import Live
from rich.panel import Panel
from rich.progress import BarColumn, Progress, TextColumn
from rich.table import Table
from rich.text import Text

from spiral.config import Config
from spiral.models import TraceEventType
from spiral.monitor import StatusMonitor, StatusSnapshot

LOOP_LABELS: dict[str, str] = {
    "agent": "Agent",
    "verifier": "Verifier",
    "event": "Event",
    "engine": "Engine",
    "harness": "Harness",
}

PHASE_LABELS: dict[str, str] = {
    "start": "starting",
    "llm_wait": "awaiting LLM",
    "tool_executing": "tool executing",
    "complete": "complete",
    "grading": "grading",
    "verifying": "verifying",
    "analyzing": "analyzing",
    "regenerating": "regenerating features",
    "max_iterations": "max iterations",
    "idle": "idle",
}

PHASE_COLORS: dict[str, str] = {
    "llm_wait": "yellow",
    "tool_executing": "cyan",
    "complete": "green",
    "grading": "magenta",
    "analyzing": "blue",
    "regenerating": "blue",
    "max_iterations": "red",
    "idle": "dim",
}


def _fmt_dur(s: float) -> str:
    if s <= 0:
        return "--"
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = int(s % 60)
    if h:
        return f"{h}h {m}m"
    if m:
        return f"{m}m {sec}s"
    return f"{sec}s"


def _phase_label(snap: StatusSnapshot) -> str:
    phase = snap.phase.phase
    label = PHASE_LABELS.get(phase, phase)
    color = PHASE_COLORS.get(phase, "white")
    return f"[{color}]{label}[/{color}]"


def _render_header(snap: StatusSnapshot) -> Text:
    alive = "green" if snap.is_alive else "red"
    status_icon = "[green]●[/green]" if snap.is_alive else "[red]●[/red]"
    mode = snap.mode
    agent_mode = snap.agent_mode
    mode_colors = {
        "plan": "yellow",
        "bypass": "red",
        "safe": "cyan",
        "interactive": "magenta",
        "normal": "green",
    }
    am_color = mode_colors.get(agent_mode, "white")
    pid = snap.pid or "--"
    elapsed = _fmt_dur(snap.rate.elapsed_s)
    eta = _fmt_dur(snap.rate.eta_s) if snap.rate.eta_s > 0 else "--"
    rate = f"{snap.rate.rate_per_h:.1f}" if snap.rate.rate_per_h > 0 else "--"
    am_display = (
        f"[{am_color}]({agent_mode})[/{am_color}] " if agent_mode != "normal" else ""
    )
    parts = [
        Text.from_markup(
            f"{status_icon} [bold]spiral[/bold]  "
            f"{am_display}"
            f"MODE [cyan]{mode}[/cyan]  "
            f"PID [{alive}]{pid}[/{alive}]  "
            f"ELAPSED [bold]{elapsed}[/bold]  "
            f"ETA [bold]{eta}[/bold]  "
            f"RATE [bold]{rate}[/bold] feat/h"
        )
    ]
    return parts[0]


def _render_progress(snap: StatusSnapshot) -> Progress:
    progress = Progress(
        TextColumn("[bold]{task.description}"),
        BarColumn(bar_width=40),
        TextColumn("{task.completed}/{task.total} ({task.percentage:.0f}%)"),
        TextColumn("[green]✓{task.fields[ok]}[/green] [red]✗{task.fields[fail]}[/red]"),
    )
    total = snap.rate.total or 1
    completed = snap.rate.completed + snap.rate.failed
    progress.add_task(
        "PROGRESS",
        total=total,
        completed=completed,
        ok=snap.rate.completed,
        fail=snap.rate.failed,
    )
    return progress


def _render_loop_phase(snap: StatusSnapshot) -> Table:
    tbl = Table(show_header=False, box=None, padding=(0, 1))
    tbl.add_column(style="bold cyan", no_wrap=True)
    tbl.add_column()
    loop = LOOP_LABELS.get(snap.phase.loop, snap.phase.loop)
    phase = _phase_label(snap)
    tbl.add_row("LOOP", f"[bold]{loop}[/bold]  ▸  {phase}")
    if snap.current_feature_name:
        idx = snap.current_feature_index + 1
        feat_text = f'"{snap.current_feature_name}" ({idx}/{snap.rate.total})'
        if snap.current_feature_attempts > 0:
            feat_text += f"  attempt {snap.current_feature_attempts + 1}/3"
        tbl.add_row("FEATURE", feat_text)
    if snap.phase.elapsed_s > 0:
        tbl.add_row("PHASE AGE", _fmt_dur(snap.phase.elapsed_s))
    return tbl


def _render_rate_metrics(snap: StatusSnapshot) -> Table:
    tbl = Table(show_header=False, box=None, padding=(0, 1))
    tbl.add_column(style="dim", no_wrap=True)
    tbl.add_column()
    tbl.add_row(
        "feat/h", f"{snap.rate.rate_per_h:.1f}" if snap.rate.rate_per_h > 0 else "--"
    )
    tbl.add_row("avg iter/feat", f"{snap.rate.avg_iters_per_feat:.1f}")
    tbl.add_row("verif/feat", f"{snap.rate.avg_retries:.1f}")
    tbl.add_row("remaining", str(snap.rate.remaining))
    return tbl


def _render_llm_tools(snap: StatusSnapshot) -> Table:
    tbl = Table(show_header=False, box=None, padding=(0, 1))
    tbl.add_column(style="dim", no_wrap=True)
    tbl.add_column()
    last = f"{snap.llm.last_latency_s:.1f}s" if snap.llm.last_latency_s > 0 else "--"
    avg = f"{snap.llm.avg_latency_s:.1f}s" if snap.llm.avg_latency_s > 0 else "--"
    tbl.add_row("LLM calls", str(snap.llm.calls))
    tbl.add_row("LLM last", last)
    tbl.add_row("LLM avg", avg)
    if snap.context_tokens > 0:
        pct = (
            (snap.context_tokens / snap.context_window * 100)
            if snap.context_window
            else 0
        )
        color = "red" if pct > 80 else ("yellow" if pct > 60 else "green")
        tbl.add_row(
            "Context",
            f"[{color}]{snap.context_tokens}/{snap.context_window}[/{color}] ({pct:.0f}%)",
        )
    tbl.add_row("LLM errors", str(snap.llm.errors))
    tbl.add_row("LLM timeouts", str(snap.llm.timeouts))
    tbl.add_row("TOOL calls", str(snap.tools.calls))
    tbl.add_row("TOOL errors", str(snap.tools.errors))
    if snap.tools.top_tools:
        top = "  ".join(f"{n}({c})" for n, c in snap.tools.top_tools[:3])
        tbl.add_row("TOOL top", top)
    return tbl


def _render_recent(snap: StatusSnapshot) -> Table:
    tbl = Table(show_header=False, box=None, padding=(0, 1), expand=True)
    tbl.add_column(style="dim", width=10)
    tbl.add_column(style="cyan", width=10)
    tbl.add_column(style="white")
    if not snap.recent_events:
        tbl.add_row("--", "--", "no traces yet")
        return tbl
    for t in snap.recent_events[-8:]:
        etype = t.event_type.value
        feat = t.feature or "*"
        data_str = _event_summary(t)
        tbl.add_row(etype, feat, data_str)
    return tbl


def _event_summary(t: Any) -> str:
    et = t.event_type
    if et == TraceEventType.TOOL_CALL:
        return f"tool_call {t.data.get('tool', '?')}"
    if et == TraceEventType.TOOL_RESULT:
        return f"tool_result {t.data.get('tool', '?')}"
    if et == TraceEventType.VERIFICATION:
        status = t.data.get("status", "")
        score = t.data.get("score", "")
        return f"grade status={status} score={score}"
    if et == TraceEventType.VERIFICATION_RETRY:
        return f"retry attempt={t.data.get('attempt', '?')}"
    if et == TraceEventType.ENGINE_ANALYSIS:
        return f"analysis #{t.data.get('count', '?')}"
    if et == TraceEventType.HARNESS_IMPROVEMENT:
        return f"improvement: {t.data.get('improvement', '')[:80]}"
    if et == TraceEventType.EVENT_COMPLETE:
        return f"✓ done (next={t.data.get('next_index', '?')})"
    if et == TraceEventType.ERROR:
        return f"ERROR {t.data.get('error', '')}"
    if et == TraceEventType.AGENT_STEP:
        return f"agent {t.data.get('action', '?')}"
    if et == TraceEventType.EVENT_TRIGGER:
        return "trigger"
    return str(t.data)[:80]


def _render_failures(snap: StatusSnapshot) -> Text:
    if not snap.failures:
        return Text("")
    lines = ["[bold red]FAILURES[/bold red]"]
    for f in snap.failures[-5:]:
        lines.append(f"  [red]✗[/red] {f}")
    return Text.from_markup("\n".join(lines))


def _render_dead(snap: StatusSnapshot) -> Text:
    if snap.is_alive or snap.status_file_missing:
        return Text("")
    return Text.from_markup(
        f"[red]●[/red] [bold red]PID {snap.pid} not running[/bold red]  "
        f"(last phase: {snap.phase.loop}/{snap.phase.phase})"
    )


def render_snapshot(snap: StatusSnapshot) -> Panel:
    progress = _render_progress(snap)

    cols = Table.grid(expand=True)
    cols.add_column(ratio=1)
    cols.add_column(ratio=1)
    cols.add_row(_render_rate_metrics(snap), _render_llm_tools(snap))

    recent = _render_recent(snap)

    body = Group(
        _render_header(snap),
        Text(""),
        progress,
        Text(""),
        _render_loop_phase(snap),
        Text(""),
        cols,
        Text(""),
        Panel(recent, title="RECENT EVENTS", border_style="dim"),
        _render_failures(snap),
        _render_dead(snap),
    )
    return Panel(body, title="[bold]spiral watch[/bold]", border_style="blue")


def watch(config: Config | None = None, refresh_s: float | None = None) -> None:
    cfg = config or Config()
    interval = refresh_s or cfg.WATCH_POLL_INTERVAL_S
    monitor = StatusMonitor(cfg)

    try:
        with Live(refresh_per_second=2, screen=False) as live:
            while True:
                snap = monitor.snapshot()
                live.update(render_snapshot(snap))
                time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[spiral watch] stopped")
