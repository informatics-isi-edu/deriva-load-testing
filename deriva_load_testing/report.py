"""Output: stdout summary and the raw CSV / JSON writers.

Phase 2 ships only ``print_counts`` (per-visit lines + a status tally). The raw file
writers and the full per-milestone stats summary land in Phase 3; the raw file is the
source of truth, the summary is a convenience view computed from the same rows.
"""

from __future__ import annotations

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
    "t0_iso",
    "status",
    "failed_at",
    "error_status",
    "error_message",
]

# tally order for the stdout summary
STATUS_ORDER = ("ok", "network_error", "chaise_error", "timeout")


def _fmt(value) -> str:
    return "-" if value is None else f"{value:.0f}"


def format_visit(r) -> str:
    """One display line for a single visit."""
    marks = f"navbar={_fmt(r.navbar_load_ms)} main={_fmt(r.main_data_load_ms)} full={_fmt(r.full_page_load_ms)}"
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


def print_tally(rows) -> None:
    """Final status tally over the recorded visits."""
    counts = {status: 0 for status in STATUS_ORDER}
    for r in rows:
        counts[r.status] = counts.get(r.status, 0) + 1
    tally = "  ".join(f"{status}={counts.get(status, 0)}" for status in STATUS_ORDER)
    print(f"\n{len(rows)} visits: {tally}")


# TODO(phase-3): write_csv, write_json (rich archive), print_summary
#   (count/min/max/mean/median/p95/p99 per milestone + failure counts by type).
