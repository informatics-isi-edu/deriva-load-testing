"""Output: stdout progress + summary, and (later) the raw CSV / JSON writers.

Per-visit streaming (``print_visit``) and the stats summary (``print_summary``) are done.
The CSV and JSON file writers come next; the raw file will be the source of truth, the
summary a convenience view computed from the same rows.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime

import numpy as np

# CSV columns (lean, one row per page visit):
CSV_COLUMNS = [
    "session_id",
    "run",
    "page_order",
    "app",
    "identifier",
    "schema_table",
    "filter",
    "navbar_load_ms",
    "main_data_load_ms",
    "full_page_load_ms",
    "all_facets_loaded_ms",
    "all_aggregates_loaded_ms",
    "submit_ms",
    "t0_iso",
    "status",
    "failed_at",
    "error_status",
    "error_message",
]

# tally order for the stdout summary
STATUS_ORDER = ("ok", "network_error", "chaise_error", "timeout")

# timing milestones to summarize (label, VisitResult attribute)
_SUMMARY_METRICS = (
    ("navbar", "navbar_load_ms"),
    ("main", "main_data_load_ms"),
    ("full", "full_page_load_ms"),
    ("submit", "submit_ms"),
)

_STAT_HEADER = f"{'metric':<7}{'n':>5}{'mean':>8}{'med':>8}{'min':>8}{'max':>8}{'p95':>8}{'p99':>8}"


def _fmt(value) -> str:
    return "-" if value is None else f"{value:.0f}"


def _stat_line(label, vals):
    """One stats row (mean/med/min/max/p95/p99, ms) for a list of values, or None if empty."""
    if not vals:
        return None
    a = np.array(vals, dtype=float)
    return (
        f"{label:<7}{len(vals):>5}{a.mean():>8.0f}{np.median(a):>8.0f}"
        f"{a.min():>8.0f}{a.max():>8.0f}{np.percentile(a, 95):>8.0f}{np.percentile(a, 99):>8.0f}"
    )


def format_visit(r) -> str:
    """One display line for a single visit."""
    marks = f"navbar={_fmt(r.navbar_load_ms)} main={_fmt(r.main_data_load_ms)} full={_fmt(r.full_page_load_ms)}"
    if r.submit_ms is not None:
        marks += f" submit={_fmt(r.submit_ms)}"
    run_label = "warm" if r.run < 0 else f"r{r.run}"
    detail = ""
    if r.status != "ok":
        detail = f"  [{r.failed_at or '?'}] {r.error_message or ''}".rstrip()
    return (
        f"[s{r.session_id} {run_label} #{r.page_order}] {r.app:9} "
        f"{r.identifier:40.40} {r.status:13} {marks}{detail}"
    )


# --- entry points (called from cli) ---


def print_visit(r) -> None:
    """Stream one visit as it completes, so a long run shows live progress."""
    print(format_visit(r), flush=True)


def print_summary(rows) -> None:
    """Two views of the timings (ms): per individual page load (over ok visits), and per run
    (each milestone summed across the run's pages, over complete runs; the AIM1 view). Plus
    failure counts."""
    total = len(rows)
    ok = [r for r in rows if r.status == "ok"]
    counts = {
        status: sum(1 for r in rows if r.status == status) for status in STATUS_ORDER
    }

    print(f"\n=== summary: {total} visits, {len(ok)} ok ===")

    if rows:
        # wall-clock span: first visit start to last visit start (t0_iso)
        times = [datetime.fromisoformat(r.t0_iso) for r in rows]
        secs = int((max(times) - min(times)).total_seconds())
        print(f"elapsed: {secs // 60}m{secs % 60:02d}s ({secs}s), first to last visit")

    print(f"\nper page, over {len(ok)} ok visits:")
    print(_STAT_HEADER)
    for label, attr in _SUMMARY_METRICS:
        line = _stat_line(
            label, [getattr(r, attr) for r in ok if getattr(r, attr) is not None]
        )
        if line:
            print(line)

    # per run: sum each milestone across the run's pages, keeping only complete runs (all pages ok)
    by_run = defaultdict(list)
    for r in rows:
        by_run[(r.session_id, r.run)].append(r)
    complete = [
        visits for visits in by_run.values() if all(v.status == "ok" for v in visits)
    ]
    dropped = len(by_run) - len(complete)
    pages = max((len(v) for v in by_run.values()), default=0)

    print(
        f"\nper run (summed over {pages} pages), {len(complete)} complete / {dropped} dropped:"
    )
    print(_STAT_HEADER)
    for label, attr in _SUMMARY_METRICS:
        sums = [
            sum(getattr(v, attr) for v in visits if getattr(v, attr) is not None)
            for visits in complete
            if any(getattr(v, attr) is not None for v in visits)
        ]
        line = _stat_line(label, sums)
        if line:
            print(line)

    fails = "  ".join(
        f"{status}={counts[status]}" for status in STATUS_ORDER if status != "ok"
    )
    print(f"\nfailures: {total - len(ok)}/{total}  ({fails})")
