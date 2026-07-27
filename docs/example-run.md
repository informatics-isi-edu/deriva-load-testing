# Example: running a load test end to end

A concrete walkthrough of a real load test, sizing a server for about 35 concurrent users. Adjust the box counts, URLs, and versions to your own target. The tool is self-contained, so every box runs the same `deriva-load-test` command and there is no orchestrator.

## The shape

A load test is background load plus one measured client.

- **Background boxes** hold a steady concurrency on the server by looping a pool of pages. They are not recorded, they only generate load. Headless Chromium costs about 1 vCPU per session, so you need enough boxes. A 16 vCPU box delivers about 11 sessions before the generator itself becomes the bottleneck. For 35 users use 3 to 4 boxes.
- **The measured client** is a separate clean box that walks a fixed pool once per run and records each page's load time. That is the number a user feels. Keep it at 1 session so it measures the server, not itself.

## 1. Set up each box

Same steps on every background box and on the measured client. This example uses Ubuntu 24.04 and Python 3.12, adjust to what you have.

```bash
# uv (user-local, does not touch the system Python)
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.local/bin/env
uv python install 3.12

# the tool
mkdir -p ~/workspace && cd ~/workspace
git clone https://github.com/informatics-isi-edu/deriva-load-testing.git
cd deriva-load-testing
uv sync --python 3.12 --python-preference only-managed

# headless chromium plus its system libraries (the one sudo step)
uv run playwright install chromium
uv run playwright install-deps chromium
```

Then set the target and cookie:

```bash
cp .env-sample .env
# edit .env: LOAD_TEST_BASE_URL and a fresh webauthn cookie, valid for the whole run
```

The target must run a chaise build with performance logging on (`performanceLogging: true` in `chaise-config.js`), since the tool reads chaise's own load milestones.

## 2. Prepare the URL pools

Two pools, background and main. Background is reads (record, recordset) plus optional edits. Main is the fixed page walk you measure.

```bash
cp urls/sample-background.json urls/my-background.json   # real catalog, schema:table, RIDs
cp urls/sample-main.json       urls/my-main.json
```

Each entry needs an `app` (`record`, `recordset`, or `recordedit`). A `recordedit` entry can add `action: submit` and `inputs` to fill and submit the form.

For a multi-box run, give each box its own disjoint slice of the pool so no two boxes hit the same rows. `--partition-size N` hands each session its own N contiguous pages. We use `--partition-size 2` so each session does one read and one edit. Split the pool into one file per box. `urls/gen_background.py` is the script we use to build and split the PDB pool, adapt it for your catalog.

## 3. Start the background load

One command per box, each on its own box with its own file, under `nohup` so it survives an SSH drop. `--loop` runs until you stop it. `--think-time` adds a pause between visits (`5-20s`, `1s`, `500ms`).

```bash
# box 1
nohup uv run --env-file .env deriva-load-test \
  --url-file urls/my-background-box1.json --sessions 11 --partition-size 2 \
  --visit-timeout 180 --loop > bg.log 2>&1 &

# box 2, box 3, ... the same command with each box's own file
```

Watch each box with `vmstat 1`. If a box is not mostly idle it is saturating and under-delivering the load. Lower its `--sessions` or add a box.

## 4. Run the measured client

Once the background is steady, run the measured client. `--runs` is the number of recorded passes through the main pool, `--csv` writes the per-visit table.

```bash
uv run --env-file .env deriva-load-test \
  --url-file urls/my-main.json --runs 5 --sessions 1 \
  --visit-timeout 180 --csv output/run.csv
```

Add `--warmup 1` for an unrecorded pass first if you want the caches warm. The banner echoes the settings (sessions, runs, think-time) so you can confirm what it is running.

When it finishes, the run prints a summary and writes the per-visit table to the `--csv` file. That CSV is the main result. Compare configs by the page that matters to a user (the heaviest record page's full load), not just the aggregate.

## What to watch

**Server** (`vmstat 1`):
- `id` (idle %): keep some idle at your target load. 10 to 30% idle means it is working but not pinned. Sustained near 0% means it is saturated, so the config or the box is the limit.
- `r` (run queue): near the core count is healthy. Several times the cores is heavy oversubscription.
- `wa` (io wait): a few % at most. High io wait means the DB or disk is the bottleneck, not CPU.
- `st` (steal): 0 on a fixed instance. A few % on a burstable instance means the hypervisor is reclaiming CPU, so you are not getting all the vCPUs.

CPU split, to see which processes use the CPU. Sum `%CPU` by process, or by user to separate the app from TLS:

```bash
# by process name (httpd, postgres, ...)
top -bn2 -d1 | awk '
  /^[[:space:]]*PID[[:space:]]+USER/ { hdr++; next }
  hdr==2 && $1 ~ /^[0-9]+$/ { cpu[$NF]+=$9 }
  END { for (k in cpu) if (cpu[k] > 0.5) printf "%8.1f%%  %s\n", cpu[k], k }
' | sort -rn | head

# by user + process (separates the app user from apache/TLS)
top -bn2 -d1 | awk '
  /^[[:space:]]*PID[[:space:]]+USER/ { hdr++; next }
  hdr==2 && $1 ~ /^[0-9]+$/ { cpu[$2" "$NF]+=$9 }
  END { for (k in cpu) if (cpu[k] > 0.5) printf "%8.1f%%  %s\n", cpu[k], k }
' | sort -rn | head -20
```

`%CPU` is per core, so one full core is 100% and an N-core box tops out at N x 100%. Expect the app processes to dominate. If the database or io wait is high instead, the bottleneck is not CPU.

**Generators** (`vmstat 1` or `htop`): each should stay mostly idle. Chromium is about 0.3 to 0.5 GB and about 1 vCPU per session under load. If a generator is not idle it is under-delivering, so lower its `--sessions` or add a box.
