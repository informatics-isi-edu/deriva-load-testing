"""Loading and ordering the URL pool.

The URL list is an external JSON file (see ``urls/sample-*.json``). Each entry describes
one chaise page to visit. ``app`` decides which load milestones the runner waits for, so
it is required.

Background and main use *different* pools (passed as separate ``--url-file`` values).
The main pool may also contain ``recordedit`` entries, which carry an optional action to
perform after the form loads (click submit, optionally filling inputs first).
"""

from __future__ import annotations

import json
import random
from dataclasses import dataclass, field
from pathlib import Path

VALID_APPS = ("record", "recordset", "recordedit")


@dataclass
class PageURL:
    """One page to visit."""

    url: str            # path appended to the chaise base url, e.g. "/recordset/#1/S:T"
    app: str            # "record" | "recordset" | "recordedit"
    identifier: str     # human-readable label for reports
    schema_table: str = ""
    filter: str = ""

    # recordedit only: what to do after the form loads. Shape may evolve in the
    # recordedit phase. action="submit" clicks the submit button; inputs (optional)
    # fills fields first, e.g. [{"name": "Description", "value": "load test"}].
    action: str = ""
    inputs: list = field(default_factory=list)


def load_urls(path: str | Path) -> list[PageURL]:
    """Load and validate the URL list from a JSON file."""
    data = json.loads(Path(path).read_text())
    if not isinstance(data, list) or not data:
        raise ValueError(f"{path}: expected a non-empty JSON array of URL entries")

    pages: list[PageURL] = []
    for i, entry in enumerate(data):
        app = entry.get("app")
        if app not in VALID_APPS:
            raise ValueError(f"{path}[{i}]: 'app' must be one of {VALID_APPS}, got {app!r}")
        if not entry.get("url"):
            raise ValueError(f"{path}[{i}]: 'url' is required")
        pages.append(
            PageURL(
                url=entry["url"],
                app=app,
                identifier=entry.get("identifier", entry["url"]),
                schema_table=entry.get("schema_table", ""),
                filter=entry.get("filter", ""),
                action=entry.get("action", ""),
                inputs=entry.get("inputs", []) or [],
            )
        )
    return pages


def ordered(
    pages: list[PageURL],
    order: str = "sequential",
    seed: int = 12,
    count: int | None = None,
) -> list[PageURL]:
    """Return the pool in the requested order, optionally truncated to ``count``.

    ``sequential`` keeps the given order (the default, used by the main run).
    ``shuffle`` applies a deterministic seeded shuffle (handy for background sessions so
    they do not all march through the pool in lockstep).
    """
    res = list(pages)
    if order == "shuffle":
        random.Random(seed).shuffle(res)
    elif order != "sequential":
        raise ValueError(f"order must be 'sequential' or 'shuffle', got {order!r}")
    if count is not None:
        res = res[:count]
    return res
