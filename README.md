# deriva-load-testing

A generic load testing tool for [chaise](https://github.com/informatics-isi-edu/chaise)
page performance. It opens chaise pages in headless Chromium, reads chaise's own load
milestones, and writes the raw timings to a file plus a summary.

Self-contained: run it by hand on any VM, no orchestrator and no database.

## Requirements

- A chaise deployment built with the performance-logging instrumentation and
  `performanceLogging: true` in its `chaise-config.js` (the tool reads `window.__chaisePerf`).
- Python >= 3.11 and [uv](https://docs.astral.sh/uv/).

## Install

```bash
uv sync
uv run playwright install chromium
```

## Development

Formatting and linting use [ruff](https://docs.astral.sh/ruff/), pinned as a dev dependency
(config in `pyproject.toml`):

```bash
uv run ruff format .   # format
uv run ruff check .    # lint
```

## Auth

Pages are usually not anonymous. Provide a `webauthn` cookie for the target via `--cookie`
or the `LOAD_TEST_COOKIE` env var (see `.env-sample`). Keep the run inside the cookie's
lifetime.

## How it works

The experiment is background load plus a measured client:

- **Background** sessions cycle a pool of URLs to hold steady concurrency on the server.
  They usually shuffle the order so sessions do not march in lockstep, and they run for a
  duration without recording.
- **Main** is a separate clean client (e.g. your laptop) that walks its own pool in the
  given order and records each visit.

Background and main use **different URL pools** (see `urls/sample-background.json` and
`urls/sample-main.json`). The main pool may include `recordedit` pages, which perform an
action after the form loads (click submit, optionally filling inputs first).

```bash
# load VM: start first, let it ramp
uv run deriva-load-test --base-url https://HOST/chaise/ \
  --url-file urls/background.json --sessions 40 --order shuffle \
  --think-time 5-20s --duration 30m --cookie "webauthn=..."

# measurement (e.g. your laptop): after the load is running
uv run deriva-load-test --base-url https://HOST/chaise/ \
  --url-file urls/main.json --sessions 1 --runs 20 \
  --cookie "webauthn=..." --csv results.csv
```

## Running a real load test

To stress a server you usually need several generator boxes plus a separate measured client. The flags that matter for that:

- `--partition-size N` gives each session its own N contiguous URLs, so sessions and boxes do not overlap. We use `--partition-size 2` (one read plus one edit per session).
- `--loop` runs the background generator until Ctrl-C. `--duration 20m` is the timed alternative.
- `--warmup 1` runs an unrecorded pass before the measured runs.
- `--visit-timeout` caps each page in seconds. Raise it under heavy load so slow pages are not counted as failures.

Capacity: headless Chromium costs about 1 vCPU per session, so a 16 vCPU box delivers about 11 sessions before it saturates and under-delivers. Use enough boxes and watch each with `vmstat 1`.

See [docs/example-run.md](docs/example-run.md) for a full end to end walkthrough.

## Output

`--csv` is the per-visit table and the source of truth. The run also prints a summary
(per-metric mean, median, p95 across runs).

## URL list

`--url-file` is a JSON array; see `urls/sample-background.json` and `urls/sample-main.json`.
Each entry needs `app` (`record`, `recordset`, or `recordedit`) so the runner knows which
milestones to wait for. `recordedit` entries may add `action` (`submit`) and `inputs` (a
list of `{name, value}` to fill before submitting).
