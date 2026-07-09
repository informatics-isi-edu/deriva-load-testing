"""Command-line entry points.

``deriva-load-test``  -> main_runner  (run a load / measurement experiment)
``deriva-load-plot``  -> main_plot    (render a violin from a results CSV)

``main_runner`` / ``main_plot`` at the bottom are the console-script entry points; the
parsers, config, and validation helpers above them are called only from there.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import re
import sys
from dataclasses import dataclass

from deriva_load_testing import report
from deriva_load_testing.patterns import run_background, run_measured
from deriva_load_testing.runner import build_cookie
from deriva_load_testing.urls import load_urls


@dataclass
class RunConfig:
    """Everything a run needs, assembled from the parsed args + the validated pool."""

    base_url: str
    cookie_dict: dict | None
    pool: list
    sessions: int
    cache: str
    visit_timeout: float
    think_time: str | None
    order: str
    seed: int
    page_size: int | None
    runs: int = 0
    warmup: int = 0
    duration_seconds: float | None = None
    loop: bool = False


def _build_runner_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="deriva-load-test",
        description="Run a chaise load / measurement experiment.",
    )
    p.add_argument(
        "--base-url",
        default=os.environ.get("LOAD_TEST_BASE_URL"),
        help="chaise base url of the target (or LOAD_TEST_BASE_URL)",
    )
    p.add_argument(
        "--url-file",
        help="JSON list of pages (background and main use different pools)",
    )
    p.add_argument(
        "--sessions", type=int, default=1, help="concurrent browser contexts"
    )
    p.add_argument(
        "--cookie",
        default=os.environ.get("LOAD_TEST_COOKIE"),
        help="webauthn cookie value (or LOAD_TEST_COOKIE)",
    )
    p.add_argument("--cache", choices=["cold", "session"], default="cold")
    p.add_argument(
        "--visit-timeout", type=float, default=60.0, help="per-visit budget (seconds)"
    )
    p.add_argument("--csv", help="write the lean raw table here")
    p.add_argument("--json", help="write the full-resolution archive here")
    p.add_argument(
        "--capture-bodies",
        action="store_true",
        help="store truncated failed-response bodies (json only)",
    )

    # lifetime: a finite measured run (main) vs a background load generator
    p.add_argument(
        "--runs", type=int, help="finite, measured: passes through the pool (main)"
    )
    p.add_argument(
        "--duration",
        help="background load generator for this long, e.g. 20m (not measured)",
    )
    p.add_argument(
        "--loop",
        action="store_true",
        help="background load generator until Ctrl-C (not measured)",
    )
    p.add_argument("--think-time", help="pause between visits, e.g. 5-20s")
    p.add_argument(
        "--warmup", type=int, default=0, help="unrecorded passes before measured runs"
    )
    p.add_argument(
        "--order",
        choices=["sequential", "shuffle"],
        default="sequential",
        help="visit order; main defaults to sequential, background usually shuffles",
    )
    p.add_argument(
        "--seed", type=int, default=12, help="seed used when --order shuffle"
    )
    p.add_argument("--page-size", type=int, help="how many urls from the pool to use")
    return p


def _build_plot_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="deriva-load-plot",
        description="Render a violin chart from a results CSV.",
    )
    p.add_argument("csv", help="the raw CSV written by deriva-load-test")
    p.add_argument("--metric", choices=["navbar", "main", "full"], default="main")
    p.add_argument(
        "--keep-incomplete",
        action="store_true",
        help="do not drop runs that have a failed visit",
    )
    p.add_argument("--out", default="violin.html", help="output .html or .png")
    return p


def _parse_duration(spec: str) -> float:
    """Parse a duration like '30s', '20m', '1h', '500ms' into seconds."""
    m = re.fullmatch(r"\s*(\d+(?:\.\d+)?)\s*(ms|s|m|h)?\s*", spec.lower())
    if not m:
        raise ValueError(f"bad --duration {spec!r} (try 30s, 20m, 1h)")
    return (
        float(m.group(1)) * {"ms": 0.001, "s": 1, "m": 60, "h": 3600}[m.group(2) or "s"]
    )


def _build_config(args) -> tuple[RunConfig, bool]:
    """Validate args and assemble a RunConfig. Raises ValueError with a user-facing message
    on bad input. Returns (cfg, measured) where measured picks the run vs background path."""
    if not args.base_url:
        raise ValueError("--base-url (or LOAD_TEST_BASE_URL) is required")
    if not args.url_file:
        raise ValueError("--url-file is required")

    measured = args.runs is not None
    background = bool(args.duration) or args.loop
    if measured and background:
        raise ValueError(
            "--runs is a measured run; --duration/--loop are background load. pick one."
        )
    if not measured and not background:
        raise ValueError(
            "specify a lifetime: --runs N (measured) or --duration DUR / --loop (background)"
        )

    pool = load_urls(args.url_file)
    if not args.cookie:
        print(
            "warning: no --cookie/LOAD_TEST_COOKIE; chaise pages are usually not anonymous",
            file=sys.stderr,
        )
    if args.capture_bodies:
        print(
            "note: --capture-bodies takes effect in Phase 3 (the JSON archive)",
            file=sys.stderr,
        )

    cfg = RunConfig(
        base_url=args.base_url,
        cookie_dict=build_cookie(args.cookie, args.base_url) if args.cookie else None,
        pool=pool,
        sessions=args.sessions,
        cache=args.cache,
        visit_timeout=args.visit_timeout,
        think_time=args.think_time,
        order=args.order,
        seed=args.seed,
        page_size=args.page_size,
        runs=args.runs or 0,
        warmup=args.warmup,
        duration_seconds=_parse_duration(args.duration) if args.duration else None,
        loop=args.loop,
    )
    return cfg, measured


# --- entry points (console scripts) ---


def main_runner(argv: list[str] | None = None) -> int:
    args = _build_runner_parser().parse_args(argv)
    try:
        cfg, measured = _build_config(args)
    except (OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    if measured:
        print(
            f"measuring: {len(cfg.pool)} page(s) x {cfg.runs} run(s), {cfg.sessions} session(s), "
            f"cache={cfg.cache}, up to {cfg.visit_timeout:.0f}s per visit",
            file=sys.stderr,
        )
        rows = asyncio.run(run_measured(cfg, on_visit=report.print_visit))
        report.print_tally(rows)
        return 0

    lifetime = (
        f"{cfg.duration_seconds:.0f}s"
        if cfg.duration_seconds is not None
        else "until Ctrl-C"
    )
    print(
        f"background load: {cfg.sessions} session(s), {len(cfg.pool)} page(s), "
        f"order={cfg.order}, {lifetime}",
        file=sys.stderr,
    )
    stats = {"visits": 0, "errors": 0}
    try:
        asyncio.run(run_background(cfg, stats))
    except KeyboardInterrupt:
        print("\ninterrupted; stopping background load", file=sys.stderr)
    print(
        f"background: {stats['visits']} visits, {stats['errors']} non-ok",
        file=sys.stderr,
    )
    return 0


def main_plot(argv: list[str] | None = None) -> int:
    args = _build_plot_parser().parse_args(argv)
    raise NotImplementedError(
        f"plot lands in Phase 4. parsed csv={args.csv!r}, metric={args.metric!r}."
    )
