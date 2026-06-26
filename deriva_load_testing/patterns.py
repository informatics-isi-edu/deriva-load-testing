"""The steady load pattern.

Implemented in Phase 2.

Each session walks its URL pool. The main run uses the given order (sequential) by
default and records each visit; a background generator usually shuffles and runs for a
duration without recording. recordedit entries perform their action (click submit,
optionally fill inputs first) after the form loads.
"""

from __future__ import annotations

# TODO(phase-2): measured run + load-generator lifetimes, think time, sequential/shuffle
#   order, recordedit submit/fill action.
