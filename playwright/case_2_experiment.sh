#!/bin/bash
# $1: chaise url
# $2: the batch id
# $3: how many times we should go through the pages (default 10)
# $4: the seed number that will be used for ordering the URLs.
# $5: the number of pages that we should go through
# $6: the usecase name (baseline, rsd_elb, rds, etc)
# $7: number of background users
# $8: whether we should skip storing the data in db (by default we will store the data in db)
# $9: number of workers (default 1)
# ./case_2_experiment.sh "https://staging.atlas-d2k.org/~ashafaei/chaise-load-testing/" "some-random-id" 10 12 20 "baseline" 5

# NOTE don't forget to define LOAD_TEST_CLIENT_NAME, LOAD_TEST_AUTH_COOKIE
export LOAD_TEST_CHAISE_URL=$1
export LOAD_TEST_BATCH_ID=$2
export LOAD_TEST_NUM_RUNS=$3
export LOAD_TEST_SEED=$4
export LOAD_TEST_PAGE_SIZE=$5
export LOAD_TEST_USE_CASE_LABEL=$6
export LOAD_TEST_NUM_BG_USERS=$7
export LOAD_TEST_SKIP_REPORT_SAVE=$8

NUM_WORKERS=${9:-1}

echo "running case_2_experiment.sh with batch_id=$2, num_runs=$3, seed=$4, page_size=$5, use_case=$6, num_bg_users=$7, skip_report_save=$8, num_workers=$NUM_WORKERS"


if [ $NUM_WORKERS -gt 1 ]; then
  npx playwright test --workers $NUM_WORKERS --config case2.config.ts --reporter=dot
else
  npx playwright test --workers 1 --config case2.config.ts
fi
