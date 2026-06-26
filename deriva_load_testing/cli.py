"""Command-line entry points.

``deriva-load-test``  -> main_runner  (run a load / measurement experiment)
``deriva-load-plot``  -> main_plot    (render a violin from a results CSV)

The argument surface follows the plan. Logic lands in later phases; for now the entry
points parse arguments and report that the work is not implemented yet.
"""

from __future__ import annotations

import argparse
import os


def _build_runner_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="deriva-load-test",
        description="Run a chaise load / measurement experiment.",
    )
    p.add_argument("--base-url", default=os.environ.get("LOAD_TEST_BASE_URL"),
                   help="chaise base url of the target (or LOAD_TEST_BASE_URL)")
    p.add_argument("--url-file", help="JSON list of pages (background and main use different pools)")
    p.add_argument("--sessions", type=int, default=1, help="concurrent browser contexts")
    p.add_argument("--cookie", default=os.environ.get("LOAD_TEST_COOKIE"),
                   help="webauthn cookie value (or LOAD_TEST_COOKIE)")
    p.add_argument("--cache", choices=["cold", "session"], default="cold")
    p.add_argument("--visit-timeout", type=float, default=60.0, help="per-visit budget (seconds)")
    p.add_argument("--csv", help="write the lean raw table here")
    p.add_argument("--json", help="write the full-resolution archive here")
    p.add_argument("--capture-bodies", action="store_true",
                   help="store truncated failed-response bodies (json only)")

    # lifetime: a finite measured run (main) vs a background load generator
    p.add_argument("--runs", type=int, help="finite, measured: passes through the pool (main)")
    p.add_argument("--duration", help="background load generator for this long, e.g. 20m (not measured)")
    p.add_argument("--loop", action="store_true",
                   help="background load generator until Ctrl-C (not measured)")
    p.add_argument("--think-time", help="pause between visits, e.g. 5-20s")
    p.add_argument("--warmup", type=int, default=0, help="unrecorded passes before measured runs")
    p.add_argument("--order", choices=["sequential", "shuffle"], default="sequential",
                   help="visit order; main defaults to sequential, background usually shuffles")
    p.add_argument("--seed", type=int, default=12, help="seed used when --order shuffle")
    p.add_argument("--page-size", type=int, help="how many urls from the pool to use")
    return p


def main_runner(argv: list[str] | None = None) -> int:
    args = _build_runner_parser().parse_args(argv)
    raise NotImplementedError(
        "runner lands in Phase 2. "
        f"parsed sessions={args.sessions}, runs={args.runs}, order={args.order}."
    )


def _build_plot_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="deriva-load-plot",
        description="Render a violin chart from a results CSV.",
    )
    p.add_argument("csv", help="the raw CSV written by deriva-load-test")
    p.add_argument("--metric", choices=["navbar", "main", "full"], default="main")
    p.add_argument("--keep-incomplete", action="store_true",
                   help="do not drop runs that have a failed visit")
    p.add_argument("--out", default="violin.html", help="output .html or .png")
    return p


def main_plot(argv: list[str] | None = None) -> int:
    args = _build_plot_parser().parse_args(argv)
    raise NotImplementedError(
        f"plot lands in Phase 4. parsed csv={args.csv!r}, metric={args.metric!r}."
    )
