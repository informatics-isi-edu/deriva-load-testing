# deriva-load-testing

A generic load testing tool for [chaise](https://github.com/informatics-isi-edu/chaise) page performance. It opens chaise pages in headless Chromium, reads chaise's own load milestones, and prints a summary, optionally writing the raw per-visit timings to a CSV. Self-contained: run it by hand on any VM, no orchestrator and no database.

## Requirements

- A chaise deployment with performance logging on ([`performanceLogging: true` in chaise-config](https://github.com/informatics-isi-edu/chaise/blob/master/docs/user-docs/chaise-config.md#performancelogging)).
- Python 3.11+ and [uv](https://docs.astral.sh/uv/).

## Install

```bash
uv sync
uv run playwright install chromium
uv run playwright install-deps chromium   # system libraries for headless chromium (Linux, uses sudo)
uv run deriva-load-test --help            # confirm the install works
```

## Usage

A test is background load plus one measured client, on two different URL pools:

- **Background**: many sessions loop a pool to hold a steady concurrency on the server. Not recorded. You can skip this if you just want to measure a single client with no background load.
- **Measured**: one clean client walks a fixed pool and records each page's load time.

```bash
# optional background: start first, let it ramp (on one or more boxes)
uv run --env-file .env deriva-load-test --url-file urls/my-background.json --sessions 20 --loop

# measured: once the load is steady
uv run --env-file .env deriva-load-test --url-file urls/my-main.json --runs 5 --csv results.csv
```

`.env` holds your base URL and cookie (see Auth). The `my-*.json` files are your own URL pools, copied from the `urls/sample-*.json` templates (see URL files).

Run `deriva-load-test --help` for the full flag list. For a real multi-box run (several generator boxes, disjoint URL slices, about 1 vCPU per session), see [docs/example-run.md](docs/example-run.md).

### Auth

Chaise pages are usually not anonymous. Provide a `webauthn` cookie and the target base URL through a `.env` file (see `.env-sample`), or pass them as `--cookie` and `--base-url`. Make sure the cookie is valid for the whole run window.

### URL files

The pages to run through are defined in a JSON file (a JSON array of pages), passed with `--url-file`.

- We recommend using a separate file for background and measured runs, so you can have different pools (see `urls/sample-background.json` and `urls/sample-main.json`).
- Each entry needs an `app` (`record`, `recordset`, or `recordedit`) so the runner knows which milestones to wait for.
- A `recordedit` entry may add `action` (`submit`) and `inputs` (a list of `{name, value}` to fill before submitting).

### Output

The tool prints a run summary to stdout, with mean, median, min, max, p95, and p99 for each metric. Pass `--csv filename` to also write the per-visit table, which is the source of truth, to a file.

## Development

Formatting and linting use [ruff](https://docs.astral.sh/ruff/), pinned as a dev dependency:

```bash
uv run ruff format .
uv run ruff check .
```
