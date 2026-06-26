"""Browser sessions and per-visit milestone capture.

Implemented in Phase 2. The runner launches N Chromium sessions, injects the auth
cookie, visits pages, and reads ``window.__chaisePerf`` to record each visit.
"""

from __future__ import annotations

# the structured global chaise populates when performanceLogging is on
PERF_GLOBAL = "__chaisePerf"

# truncate any captured error / response text to this many chars
MAX_ERROR_LEN = 1000

# TODO(phase-2): launch sessions, inject cookie, per-visit capture, the failure model
#   (ok | network_error | chaise_error | timeout), cold/session cache modes.
