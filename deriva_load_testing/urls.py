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
from typing import Literal, cast, get_args

AppType = Literal["record", "recordset", "recordedit"]


@dataclass
class PageURLInput:
    name: str
    value: str


@dataclass
class PageURL:
    """a page to visit"""

    url: str
    """path appended to the chaise base url, e.g. '/recordset/#1/S:T'"""

    app: AppType

    identifier: str
    """human-readable label for reports"""

    schema_table: str = ""
    filter: str = ""

    # recordedit only: what the runner does after the form loads.
    #   "submit" fills `inputs`, clicks Save, and measures the submit;
    #   "load" (or empty, the default) just measures the form load, no DB write.
    # inputs target plain text/number columns. Use {run} or {ts} in a value so repeated
    # submits actually change data (ermrestjs rejects an update that changes nothing), e.g.
    #   [{"name": "Description", "value": "load test {run}"}].
    action: str = ""
    inputs: list[PageURLInput] = field(default_factory=list)


def load_urls(path: str | Path) -> list[PageURL]:
    """load and validate a file containing the urls"""
    data = json.loads(Path(path).read_text())
    if not isinstance(data, list) or not data:
        raise ValueError(f"{path}: expected a non-empty JSON array of URL entries")

    pages: list[PageURL] = []

    for i, entry in enumerate(data):
        if not isinstance(entry, dict):
            raise ValueError(f"{path}: entry {i} is not an object")

        if "url" not in entry:
            raise ValueError(f"{path}: entry {i} is missing required 'url' key")

        app = entry.get("app")
        if app not in get_args(AppType):
            raise ValueError(f"{path}: entry {i} has invalid app '{app}'")

        pages.append(
            PageURL(
                url=entry["url"],
                app=cast(AppType, app),
                identifier=entry.get("identifier", entry["url"]),
                schema_table=entry.get("schema_table", ""),
                filter=entry.get("filter", ""),
                action=entry.get("action", ""),
                inputs=[
                    PageURLInput(name=str(x["name"]), value=str(x["value"]))
                    for x in (entry.get("inputs") or [])
                ],
            )
        )
    return pages


def ordered(
    pages: list[PageURL],
    order: Literal["sequential", "shuffle"] = "sequential",
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
