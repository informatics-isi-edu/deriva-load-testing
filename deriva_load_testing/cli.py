"""Command-line entry point.

``deriva-load-test`` -> main_runner (run a load / measurement experiment).

``main_runner`` at the bottom is the console-script entry point; the parser, config, and
validation helpers above it are called only from there.
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import logging
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import TextIO

from deriva_load_testing import report
from deriva_load_testing.patterns import parse_think_time, run_background, run_measured
from deriva_load_testing.runner import VisitResult, build_cookie
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
    headed: bool = False
    partition_size: int | None = None


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
    p.add_argument("--csv", type=Path, help="write the lean raw table here")

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
    p.add_argument(
        "--partition-size",
        type=int,
        help="give each session its own N contiguous pages, in file order "
        "(default: sessions share the whole pool)",
    )
    p.add_argument(
        "--headed",
        action="store_true",
        help="show the browser window instead of headless (debug; needs a display)",
    )
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
    if args.partition_size is not None:
        if args.partition_size < 1:
            raise ValueError("--partition-size must be >= 1")
        if args.sessions <= 1:
            raise ValueError(
                "--partition-size needs --sessions > 1 (it splits the pool across sessions; "
                "with 1 session there is nothing to split; use --page-size to limit pages)"
            )
        need = args.sessions * args.partition_size
        if len(pool) < need:
            raise ValueError(
                f"--partition-size {args.partition_size} x --sessions {args.sessions} needs {need} pages; "
                f"pool has {len(pool)}"
            )
        if len(pool) > need:
            print(
                f"note: partition uses the first {need} of {len(pool)} pages "
                f"({args.sessions} sessions x {args.partition_size})",
                file=sys.stderr,
            )
    if not args.cookie:
        print(
            "warning: no --cookie/LOAD_TEST_COOKIE; chaise pages are usually not anonymous",
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
        headed=args.headed,
        partition_size=args.partition_size,
    )
    return cfg, measured


def _is_interrupt(exc: BaseException) -> bool:
    """A Ctrl-C, or the driver-teardown errors it triggers. A terminal Ctrl-C signals the
    whole process group, so it kills the Playwright driver too; whatever browser call was in
    flight then fails with one of these signatures. Matched by message because
    TargetClosedError is not exported from the public playwright.async_api. A normal
    TimeoutError (i.e. a real failed visit) matches neither, so it still surfaces."""
    if isinstance(exc, KeyboardInterrupt):
        return True
    text = str(exc)
    return (
        "Connection closed while reading from the driver" in text
        or "Target page, context or browser has been closed" in text
    )


# --- entry points (console scripts) ---


def main_runner(argv: list[str] | None = None) -> int:
    # asyncio logs benign teardown warnings (e.g. "pipe closed by peer") when a Ctrl-C kills
    # the Playwright driver mid-write; they are noise for a CLI, so quiet them.
    logging.getLogger("asyncio").setLevel(logging.ERROR)
    args = _build_runner_parser().parse_args(argv)
    try:
        cfg, measured = _build_config(args)
    except (OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    # echo the parsed think-time so a run visibly confirms the flag was understood
    tt = parse_think_time(cfg.think_time)
    if tt:
        lo, hi = tt
        rng = f"{lo:g}s" if lo == hi else f"{lo:g} to {hi:g}s"
        think_clause = f", think-time {rng} between visits"
    else:
        think_clause = ", no think-time"

    if measured:
        print(
            f"measuring: {len(cfg.pool)} page(s) x {cfg.runs} run(s), {cfg.sessions} session(s), "
            f"cache={cfg.cache}, up to {cfg.visit_timeout:.0f}s per visit{think_clause}",
            file=sys.stderr,
        )

        csv_file: TextIO | None = None
        csv_writer: csv.DictWriter | None = None
        if args.csv:
            args.csv.parent.mkdir(parents=True, exist_ok=True)
            csv_file = open(args.csv, "w", newline="")
            csv_writer = csv.DictWriter(csv_file, fieldnames=report.CSV_COLUMNS)
            csv_writer.writeheader()

        def on_visit(r: VisitResult) -> None:
            report.print_visit(r)
            if csv_writer is not None and csv_file is not None:
                csv_writer.writerow({c: getattr(r, c) for c in report.CSV_COLUMNS})
                csv_file.flush()

        try:
            try:
                rows = asyncio.run(run_measured(cfg, on_visit=on_visit))
            except (KeyboardInterrupt, Exception) as exc:
                if not _is_interrupt(exc):
                    raise
                print(
                    "\ninterrupted; measured run needs to finish for a summary",
                    file=sys.stderr,
                )
                if args.csv:
                    print(f"partial results saved to {args.csv}", file=sys.stderr)
                return 130
            report.print_summary(rows)
            if args.csv:
                print(f"wrote {len(rows)} visits to {args.csv}", file=sys.stderr)
            return 0
        finally:
            if csv_file is not None:
                csv_file.close()

    lifetime = (
        f"for {cfg.duration_seconds:.0f}s"
        if cfg.duration_seconds is not None
        else "until Ctrl-C"
    )
    if cfg.partition_size is not None:
        scope = f"{cfg.sessions} sessions x {cfg.partition_size} pages (partition)"
    else:
        scope = (
            f"{cfg.sessions} sessions sharing {len(cfg.pool)} pages (order={cfg.order})"
        )
    print(f"background load: {scope}, {lifetime}{think_clause}", file=sys.stderr)

    stats = {"visits": 0, "per_session": {}, "failures": {}}
    interrupted = False
    try:
        asyncio.run(run_background(cfg, stats))
    except (KeyboardInterrupt, Exception) as exc:
        if not _is_interrupt(exc):
            raise
        interrupted = True

    per = stats["per_session"]
    failed = sum(stats["failures"].values())
    ok = stats["visits"] - failed
    head = "interrupted" if interrupted else "background done"
    print(
        f"\n{head}: {stats['visits']} visits ({ok} ok, {failed} failed), "
        f"{len(per)}/{cfg.sessions} sessions active",
        file=sys.stderr,
    )
    if per:
        counts = list(per.values())
        print(
            f"  visits/session: min {min(counts)}, max {max(counts)}", file=sys.stderr
        )
    if failed:
        breakdown = "  ".join(f"{k}={v}" for k, v in stats["failures"].items())
        print(f"  failures by type: {breakdown}", file=sys.stderr)
    return 0
