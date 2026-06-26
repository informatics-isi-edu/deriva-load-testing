"""Output: stdout summary and the raw CSV / JSON writers.

Implemented in Phase 3. The raw file is the source of truth; the summary is a
convenience view computed from the same rows.
"""

from __future__ import annotations

# CSV columns (lean, one row per page visit):
CSV_COLUMNS = [
    "session_id", "run", "page_order", "app", "identifier", "schema_table", "filter",
    "navbar_load_ms", "main_data_load_ms", "full_page_load_ms",
    "all_facets_loaded_ms", "all_aggregates_loaded_ms",
    "t0_iso", "status", "failed_at", "error_status", "error_message",
]

# TODO(phase-3): write_csv, write_json (rich archive), print_summary
#   (count/min/max/mean/median/p95/p99 per milestone + failure counts by type).
