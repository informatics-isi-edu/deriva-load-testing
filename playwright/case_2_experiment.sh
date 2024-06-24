#!/bin/bash
# $1: the batch id
# $2: how many times we should go through the pages (default 10)
# $3: the seed number that will be used for ordering the URLs.
# $4: the number of pages that we should go through
# $5: the usecase name (baseline, rsd_elb, rds, etc)
# $6: number of background users
# $7: whether we should store the data in db or not
# ./case_2_experiment.sh 11 "baseline" 10 20

# NOTE don't forget to define LOAD_TEST_CLIENT_NAME, LOAD_TEST_AUTH_COOKIE
export LOAD_TEST_BATCH_ID=$1
export LOAD_TEST_NUM_RUNS=$2
export LOAD_TEST_SEED=$3
export LOAD_TEST_PAGE_SIZE=$4
export LOAD_TEST_USE_CASE_LABEL=$5
export LOAD_TEST_NUM_BG_USERS=$6
export LOAD_TEST_SKIP_REPORT_SAVE=$7

echo "case_2_experiment.sh with batch_id=$1, run_count=$2, seed=$3, page_size=$4, use_case=$5, num_bg_users=$6, skip_report_save=$7"

time npx playwright test --workers 1 --config case2.config.ts
