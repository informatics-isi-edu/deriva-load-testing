"""Violin plot from the raw CSV.

Implemented in Phase 4. Reads the CSV, never re-measures. Fully local output
(.html interactive by default, or .png via kaleido).

Group by (session_id, run), sum the metric across the pool, one dot per run; drop groups
with any non-ok visit (the old num_measurements == 20 rule).
"""

from __future__ import annotations

# TODO(phase-4): build_violin(csv_path, metric, out_path)
