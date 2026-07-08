"""The steady load pattern: session loops that drive ``visit_page``.

Two lifetimes share one loop shape (walk the pool, pause, repeat):
- ``run_measured`` — the main client. A finite number of recorded passes in the given order.
- ``run_background`` — the load generator. Sessions loop (usually shuffled, desynced per
  session) for a duration or until Ctrl-C, recording only counters.

Cache modes decide the context lifetime: ``cold`` uses a fresh context per visit (empty
cache); ``session`` reuses one context per session (warm cache). Either way each visit gets
a fresh page, so the page timeline is clean and an SPA hash-only nav can't skip a reload.

``run_measured`` and ``run_background`` at the bottom are the entry points cli calls;
everything above them is a helper, in call order.
"""

from __future__ import annotations

import asyncio
import random
import sys
import time

from playwright.async_api import async_playwright

from deriva_load_testing.runner import new_context, visit_page
from deriva_load_testing.urls import ordered

# how often the background load prints a "still alive" line
HEARTBEAT_SECONDS = 5


def parse_think_time(spec):
    """Parse a think-time spec into (lo, hi) seconds. Accepts '5-20s', '5s', '500ms', or a
    bare number (seconds). Returns None when spec is falsy (no pause)."""
    if not spec:
        return None
    spec = spec.strip().lower()
    unit = 1.0
    if spec.endswith("ms"):
        unit, spec = 0.001, spec[:-2]
    elif spec.endswith("s"):
        unit, spec = 1.0, spec[:-1]
    if "-" in spec:
        lo_s, _, hi_s = spec.partition("-")
        lo, hi = float(lo_s) * unit, float(hi_s) * unit
    else:
        lo = hi = float(spec) * unit
    return (min(lo, hi), max(lo, hi))


async def _think(think, rng):
    if think:
        lo, hi = think
        await asyncio.sleep(rng.uniform(lo, hi) if hi > lo else lo)


async def _visit(browser, cfg, shared_context, page_url, session_id, run, page_order):
    """One visit, honoring the cache mode: cold makes and closes its own context; session
    reuses the caller's shared context."""
    context = (
        shared_context
        if cfg.cache == "session"
        else await new_context(browser, cfg.cookie_dict)
    )
    try:
        return await visit_page(
            context,
            page_url,
            cfg.base_url,
            cfg.visit_timeout,
            session_id=session_id,
            run=run,
            page_order=page_order,
        )
    finally:
        if cfg.cache == "cold":
            await context.close()


async def _heartbeat(stats):
    """Print running background totals every few seconds so a long load shows it is alive."""
    while True:
        await asyncio.sleep(HEARTBEAT_SECONDS)
        print(
            f"  ... {stats['visits']} visits, {stats['errors']} non-ok",
            file=sys.stderr,
            flush=True,
        )


async def _measured_session(browser, cfg, think, session_id, on_visit) -> list:
    rng = random.Random(cfg.seed + session_id)
    pages = ordered(cfg.pool, cfg.order, cfg.seed + session_id, cfg.page_size)
    rows: list = []
    shared = (
        await new_context(browser, cfg.cookie_dict) if cfg.cache == "session" else None
    )
    try:
        for _ in range(cfg.warmup):
            for order_idx, page_url in enumerate(pages):
                res = await _visit(
                    browser,
                    cfg,
                    shared,
                    page_url,
                    session_id,
                    run=-1,
                    page_order=order_idx,
                )
                if on_visit:
                    on_visit(res)
                await _think(think, rng)
        for run in range(cfg.runs):
            for order_idx, page_url in enumerate(pages):
                res = await _visit(
                    browser,
                    cfg,
                    shared,
                    page_url,
                    session_id,
                    run=run,
                    page_order=order_idx,
                )
                rows.append(res)
                if on_visit:
                    on_visit(res)
                await _think(think, rng)
    finally:
        if shared is not None:
            await shared.close()
    return rows


async def _background_session(browser, cfg, think, session_id, deadline, stats):
    rng = random.Random(cfg.seed + session_id)
    pages = ordered(cfg.pool, cfg.order, cfg.seed + session_id, cfg.page_size)
    shared = (
        await new_context(browser, cfg.cookie_dict) if cfg.cache == "session" else None
    )
    try:
        while deadline is None or time.monotonic() < deadline:
            for page_url in pages:
                if deadline is not None and time.monotonic() >= deadline:
                    break
                res = await _visit(
                    browser, cfg, shared, page_url, session_id, run=-1, page_order=-1
                )
                stats["visits"] += 1
                if res.status != "ok":
                    stats["errors"] += 1
                await _think(think, rng)
    finally:
        if shared is not None:
            await shared.close()


# --- entry points (called from cli) ---


async def run_measured(cfg, on_visit=None) -> list:
    """Run the measured main client and return every recorded visit. ``on_visit`` (if given)
    is called with each VisitResult as it completes, so callers can stream progress."""
    think = parse_think_time(cfg.think_time)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        try:
            per_session = await asyncio.gather(
                *(
                    _measured_session(browser, cfg, think, sid, on_visit)
                    for sid in range(cfg.sessions)
                )
            )
        finally:
            await browser.close()
    return [row for rows in per_session for row in rows]


async def run_background(cfg, stats) -> dict:
    """Run the background load generator until the duration deadline / Ctrl-C, updating the
    caller-owned ``stats`` dict (so partial counts survive an interrupt)."""
    think = parse_think_time(cfg.think_time)
    deadline = (
        time.monotonic() + cfg.duration_seconds
        if cfg.duration_seconds is not None
        else None
    )
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        try:
            monitor = asyncio.create_task(_heartbeat(stats))
            try:
                await asyncio.gather(
                    *(
                        _background_session(browser, cfg, think, sid, deadline, stats)
                        for sid in range(cfg.sessions)
                    )
                )
            finally:
                monitor.cancel()
        finally:
            await browser.close()
    return stats
