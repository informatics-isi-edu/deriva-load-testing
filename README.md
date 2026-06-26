# deriva-load-testing

A generic load testing tool for [chaise](https://github.com/informatics-isi-edu/chaise)
page performance. It opens chaise pages in headless Chromium, reads chaise's own load
milestones, and writes the raw timings to a file plus a summary. A companion command
turns the raw file into a violin chart.

Self-contained: run it by hand on any VM, no orchestrator and no database.

> Status: rebuild in progress. The runner and plot logic land in later phases (see the
> module docstrings). This is the cleaned project skeleton. The previous atlas-d2k
> experiment code lives on the `atlas-d2k-experiment` branch.

## Requirements

- A chaise deployment built with the performance-logging instrumentation and
  `performanceLogging: true` in its `chaise-config.js` (the tool reads `window.__chaisePerf`).
- Python >= 3.11 and [uv](https://docs.astral.sh/uv/).

## Install

```bash
uv sync
uv run playwright install chromium
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
  --cookie "webauthn=..." --csv results.csv --json results.json
```

## Output and charts

`--csv` is the lean per-visit table, `--json` is the full-resolution archive. The raw file
is the source of truth.

```bash
uv run deriva-load-plot results.csv --metric main --out violin.html
```

## URL list

`--url-file` is a JSON array; see `urls/sample-background.json` and `urls/sample-main.json`.
Each entry needs `app` (`record`, `recordset`, or `recordedit`) so the runner knows which
milestones to wait for. `recordedit` entries may add `action` (`submit`) and `inputs` (a
list of `{name, value}` to fill before submitting).
