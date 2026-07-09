# Setup on Ubuntu 24.04 (user-local)

Set up the load generator on a fresh Ubuntu 24.04 box while keeping everything under your
home directory. The system Python is never touched (uv installs and uses its own), nothing
is installed for other users, and the only system-wide action is installing the shared
libraries that headless Chromium needs (one `apt` step, run via `sudo`).

Assumes the repo is cloned at `/home/aref/workspace/deriva-load-testing` and your user has
`sudo`.

## Where things land

| Piece | Location | Needs root |
|---|---|---|
| uv binary | `~/.local/bin/uv` | no |
| uv cache + managed Python | `~/.local/share/uv`, `~/.cache/uv` | no |
| project venv + Python deps | `.../deriva-load-testing/.venv` | no |
| Chromium browser | `~/.cache/ms-playwright` | no |
| Chromium's shared libraries | system (`/usr/lib`), via `apt` | yes (step 5 only) |

---

## 1. Install uv (user-local)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.local/bin/env      # or open a new shell
uv --version                 # confirm it's on PATH
```

uv installs into `~/.local`. It does not touch system Python or anything outside your home.

## 2. Install an isolated Python (leaves the system Python alone)

```bash
uv python install 3.12
```

This downloads a standalone CPython into `~/.local/share/uv/python`, separate from the
system's `/usr/bin/python3`.

## 3. Create the venv and install dependencies

```bash
cd /home/aref/workspace/deriva-load-testing
uv sync --python 3.12 --python-preference only-managed
```

`--python-preference only-managed` forces uv to use the Python from step 2 and never the
system one. This creates `.venv` in the project and installs the locked dependencies.

## 4. Install the Chromium browser (user-local)

```bash
uv run playwright install chromium
```

Downloads Chromium into `~/.cache/ms-playwright`. No root.

## 5. Install Chromium's system libraries (the one sudo step)

```bash
uv run playwright install-deps chromium
```

Headless Chromium needs a set of shared libraries (`libnss3`, `libatk`, `libgbm`, `libasound2`,
and friends). Playwright runs the `apt` install under `sudo`, so you will be prompted for your
password. This only adds shared libraries to the system: it does not modify Python, create
users, or write to other homes.

If that command errors, the one-shot equivalent is `uv run playwright install --with-deps chromium`.

## 6. Create your `.env` (cookie + base url)

`.env` is gitignored, so it is not in the clone. Copy the sample and fill it in:

```bash
cp .env-sample .env
nano .env
```

```
LOAD_TEST_BASE_URL="https://dev.derivacloud.org/~ashafaei/chaise/"
LOAD_TEST_COOKIE="webauthn=PASTE_A_FRESH_COOKIE"
```

Grab a fresh `webauthn` cookie from a logged-in browser session on the target (DevTools,
Application, Cookies), valid for the whole run window. No stray backslashes in the URL.

## 7. Create a background URL pool

`urls/sample-background.json` is committed as a template; your real pool is gitignored
(`urls/my-*.json`). Background traffic should be record/recordset reads only (no `submit`, so
many sessions are not all writing):

```bash
cp urls/sample-background.json urls/my-background.json
nano urls/my-background.json     # real catalog / schema:table + RIDs from the target
```

## 8. Smoke test (one page, short timeout)

```bash
uv run --env-file .env deriva-load-test \
  --url-file urls/my-background.json --runs 1 --page-size 1 --visit-timeout 15
```

Expect one `ok` line with real `navbar`/`main`/`full` numbers. If Chromium fails to launch,
step 5 did not complete. If it times out, the cookie or base url is wrong, or the target is
not running the instrumented chaise build.

## 9. Run the background load

```bash
uv run --env-file .env deriva-load-test \
  --url-file urls/my-background.json \
  --sessions 40 --order shuffle --think-time 5-20s --duration 20m
```

It prints a `... N visits` heartbeat every 5 seconds; `Ctrl-C` stops early. Run your measured
client (from your laptop) against the same target while this is generating load.

## 10. Watch this box's own resources

```bash
htop        # or: top
```

Headless Chromium is roughly 0.3 to 0.5 GB per session. If this box saturates CPU or RAM, it
is the bottleneck (not the server), and the measurements are meaningless. Lower `--sessions`,
or split the load across two boxes, if it maxes out.

---

## What this does NOT touch

- The system Python (`/usr/bin/python3`) stays untouched; uv uses its own managed 3.12.
- No global `pip` installs, no new users, nothing written outside `/home/aref` except the
  shared libraries added in step 5.
