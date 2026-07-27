"""Browser sessions and per-visit milestone capture.

The runner launches headless Chromium, injects the auth cookie, visits chaise pages, and
reads ``window.__chaisePerf`` (populated only when chaiseConfig.performanceLogging is on)
to record each visit. ``patterns.py`` holds the session loops that call ``visit_page``.

The milestone values are stamped by chaise itself via ``performance.now()``; we only read
them, so our poll cadence never affects the recorded numbers, only how soon we notice the
page finished.
"""

from __future__ import annotations

import asyncio
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import urlsplit

from playwright.async_api import Error as PlaywrightError, Locator, Page

from deriva_load_testing.urls import PageURL

# the structured global chaise populates when performanceLogging is on
PERF_GLOBAL = "__chaisePerf"

# truncate any captured error / response text to this many chars
MAX_ERROR_LEN = 1000

# desktop size so facets / aggregates render like a real desktop user (not the mobile panel)
VIEWPORT = {"width": 1280, "height": 900}

# how often we re-read the global while waiting for a page to finish (see module docstring:
# this has no effect on the recorded milestone values)
POLL_INTERVAL = 0.25

CANONICAL_MILESTONES = ("navbarLoad", "mainDataLoad", "fullPageLoad")

# maps a __chaisePerf key to the VisitResult / CSV column it fills
_CANONICAL_MARKS = {
    "navbarLoad": "navbar_load_ms",
    "mainDataLoad": "main_data_load_ms",
    "fullPageLoad": "full_page_load_ms",
}

_RECORDSET_DETAIL = {
    "allFacetsLoaded": "all_facets_loaded_ms",
    "allAggregatesLoaded": "all_aggregates_loaded_ms",
}


@dataclass
class VisitResult:
    """One page visit; fields map 1:1 to ``report.CSV_COLUMNS``."""

    session_id: int
    run: int
    page_order: int

    app: str
    identifier: str
    schema_table: str
    filter: str

    t0_iso: str
    status: str = "ok"
    failed_at: str | None = None
    error_status: str | None = None
    error_message: str | None = None

    navbar_load_ms: float | None = None
    main_data_load_ms: float | None = None
    full_page_load_ms: float | None = None

    all_facets_loaded_ms: float | None = None
    all_aggregates_loaded_ms: float | None = None

    submit_ms: float | None = None


@dataclass
class SubmitResult:
    """Outcome of a recordedit submit action."""

    status: str  # "ok" | "chaise_error" | "timeout"
    submit_ms: float | None = None
    error: dict | None = None


def parse_cookie(raw: str) -> tuple[str, str]:
    """Split a cookie string into (name, value). ``webauthn=abc`` -> ('webauthn', 'abc');
    a bare value gets the default ``webauthn`` name."""
    raw = raw.strip()
    if "=" in raw:
        name, _, value = raw.partition("=")
        return name.strip(), value.strip()
    return "webauthn", raw


def build_cookie(raw: str, base_url: str) -> dict:
    """Build the Playwright cookie dict from a raw cookie string and the target base url."""
    name, value = parse_cookie(raw)
    parts = urlsplit(base_url)
    return {
        "name": name,
        "value": value,
        "domain": parts.hostname,
        "path": "/",
        "secure": parts.scheme == "https",
    }


def join_url(base: str, path: str) -> str:
    """Join the chaise base url with a page path, e.g.
    ('https://h/chaise/', '/recordset/#1/S:T') -> 'https://h/chaise/recordset/#1/S:T'."""
    return base.rstrip("/") + "/" + path.lstrip("/")


def truncate(text, limit: int = MAX_ERROR_LEN) -> str | None:
    """Coerce to str and cap the length; ``None`` stays ``None``."""
    if text is None:
        return None
    text = str(text)
    return text if len(text) <= limit else text[:limit]


async def new_context(browser, cookie_dict: dict | None):
    """A fresh browser context with the desktop viewport and (optionally) the auth cookie."""
    context = await browser.new_context(viewport=VIEWPORT)
    if cookie_dict:
        await context.add_cookies([cookie_dict])
    return context


def _perf_marks(perf) -> dict:
    """The numeric milestone marks present in a __chaisePerf snapshot, keyed by column."""
    perf = perf or {}
    marks: dict = {}
    for key, column in _CANONICAL_MARKS.items():
        val = perf.get(key)
        if isinstance(val, (int, float)):
            marks[column] = float(val)

    rs = (perf.get("detail") or {}).get("recordset") or {}
    for key, column in _RECORDSET_DETAIL.items():
        val = rs.get(key)
        if isinstance(val, (int, float)):
            marks[column] = float(val)
    return marks


def _first_missing(app: str, marks: dict) -> str | None:
    """The first expected milestone (in load order) not yet present, or None if the app's
    load is complete. Single source of truth for both 'are we done' and 'what failed'."""
    for mark in CANONICAL_MILESTONES:
        if _CANONICAL_MARKS[mark] not in marks:
            return mark
    return None


async def _wait_for_completion(page, app: str, timeout_s: float):
    """Poll the global until the app's load is done, an error is recorded, or time runs out.
    Returns (perf_snapshot, timed_out). The decision lives here in Python; the only browser
    code is the one-line accessor for a value that exists only in the page."""
    deadline = time.monotonic() + timeout_s
    perf = None
    while True:
        perf = await page.evaluate(f"() => window.{PERF_GLOBAL} || null")
        if perf and (
            perf.get("error") or _first_missing(app, _perf_marks(perf)) is None
        ):
            return perf, False
        if time.monotonic() >= deadline:
            return perf, True
        await asyncio.sleep(POLL_INTERVAL)


def classify_visit(app, perf, timed_out, goto_error=None, error_status=None) -> dict:
    """Pure decision: turn a ``__chaisePerf`` snapshot into a status plus the milestone
    columns. Returns ``{status, failed_at, error_status, error_message, marks}`` where
    ``marks`` maps ``*_ms`` columns to values (missing milestones are simply absent).

    Precedence: a goto failure is ``network_error``; a recorded chaise error is
    ``chaise_error``; running out of time is ``timeout``; otherwise ``ok``.
    """
    marks = _perf_marks(perf)

    out = {
        "status": "ok",
        "failed_at": None,
        "error_status": error_status,
        "error_message": None,
        "marks": marks,
    }

    if goto_error is not None:
        out["status"] = "network_error"
        out["failed_at"] = "goto"
        out["error_message"] = truncate(goto_error)
        return out

    error = (perf or {}).get("error")
    if error:
        out["status"] = "chaise_error"
        out["failed_at"] = error.get("milestone")
        out["error_status"] = error.get("status")
        out["error_message"] = truncate(error.get("message"))
        return out

    if timed_out:
        out["status"] = "timeout"
        out["failed_at"] = _first_missing(app, marks)
        if not marks:
            out["error_message"] = (
                "no __chaisePerf marks (is performanceLogging enabled on the target?)"
            )

    return out


def _input_locator(page: Page, name: str) -> Locator:
    safe_name = re.sub(r"[^\w-]+", "-", name)
    return page.locator(f".c_1-{safe_name}")


async def _recordedit_submit(
    page: Page, page_url: PageURL, timeout_s: float, run: int
) -> SubmitResult:
    ts = str(int(time.time()))
    try:
        for inp in page_url.inputs:
            # {run}/{ts} let a fixed pool change data each run (else ermrestjs rejects a no-op edit)
            value = inp.value.replace("{run}", str(run)).replace("{ts}", ts)
            await _input_locator(page, inp.name).fill(value)
        t_click = time.monotonic()
        await page.click("#submit-record-button")
    except PlaywrightError as exc:
        # a field never rendered or Save never enabled; record it, do not crash the run
        return SubmitResult(
            status="timeout", error={"message": str(exc).splitlines()[0]}
        )

    timeout_ms = timeout_s * 1000
    nav = asyncio.create_task(
        page.wait_for_url(re.compile(r"/record/"), timeout=timeout_ms)
    )
    fail = asyncio.create_task(
        page.wait_for_selector(".alert-danger, .alert-warning", timeout=timeout_ms)
    )

    done, pending = await asyncio.wait({nav, fail}, return_when=asyncio.FIRST_COMPLETED)
    for t in pending:
        t.cancel()
    await asyncio.gather(*pending, return_exceptions=True)

    if nav in done and nav.exception() is None:
        return SubmitResult(status="ok", submit_ms=(time.monotonic() - t_click) * 1000)

    perf = await page.evaluate(f"() => window.{PERF_GLOBAL} || null")
    err = (perf or {}).get("error")

    if err:
        return SubmitResult(status="chaise_error", error=err)
    return SubmitResult(status="timeout")


# --- entry point (called from patterns) ---


async def visit_page(
    context,
    page_url: PageURL,
    base_url: str,
    visit_timeout: float,
    *,
    session_id: int,
    run: int,
    page_order: int,
) -> VisitResult:
    """Open one page in a fresh tab, wait for its load milestones (or an error / timeout),
    and return a classified ``VisitResult``. The single visit budget is ``visit_timeout``
    seconds, split across the navigation and the wait for the marks."""
    result = VisitResult(
        session_id=session_id,
        run=run,
        page_order=page_order,
        app=page_url.app,
        identifier=page_url.identifier,
        schema_table=page_url.schema_table,
        filter=page_url.filter,
        t0_iso=datetime.now(timezone.utc).isoformat(),
    )

    page = await context.new_page()
    goto_error = None
    error_status = None
    timed_out = False
    perf = None
    submit = None
    try:
        start = time.monotonic()
        try:
            response = await page.goto(
                join_url(base_url, page_url.url),
                wait_until="commit",
                timeout=visit_timeout * 1000,
            )
        except PlaywrightError as exc:
            first_line = str(exc).splitlines()[0] if str(exc) else ""
            goto_error = first_line or "navigation failed"
        else:
            if response is not None and response.status >= 400:
                goto_error = f"HTTP {response.status} on document"
                error_status = str(response.status)

        if goto_error is None:
            remaining = max(1.0, visit_timeout - (time.monotonic() - start))
            perf, timed_out = await _wait_for_completion(page, page_url.app, remaining)

            # recordedit: once the form is ready, perform the submit action
            load_ok = not timed_out and not (perf and perf.get("error"))
            if page_url.app == "recordedit" and page_url.action == "submit" and load_ok:
                remaining = max(1.0, visit_timeout - (time.monotonic() - start))
                submit = await _recordedit_submit(page, page_url, remaining, run)

    finally:
        await page.close()

    decision = classify_visit(page_url.app, perf, timed_out, goto_error, error_status)
    result.status = decision["status"]
    result.failed_at = decision["failed_at"]
    result.error_status = decision["error_status"]
    result.error_message = decision["error_message"]
    for column, value in decision["marks"].items():
        setattr(result, column, value)

    if submit is not None:
        if submit.status == "ok":
            result.submit_ms = submit.submit_ms
        elif submit.status == "chaise_error":
            err = submit.error or {}
            result.status = "chaise_error"
            result.failed_at = "submit"
            result.error_status = err.get("status")
            result.error_message = truncate(err.get("message"))
        else:  # timeout
            result.status = "timeout"
            result.failed_at = "submit"
            if submit.error:
                result.error_message = truncate(submit.error.get("message"))
    return result
