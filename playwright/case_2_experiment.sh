#!/bin/bash
# $1: the seed number that will be used for ordering the URLs.
# $2: infrastructure name
# $3: number of concurrent users

# NOTE don't forget to define LOAD_TEST_CLIENT_NAME, LOAD_TEST_AUTH_COOKIE

export LOAD_TEST_SEED=$1
export LOAD_TEST_INFRASTRUCTURE=$2
export LOAD_TEST_NUM_CONCURRENT_USERS=$3

echo "case-2-experiment.sh with seed=$1, infra=$2, num_concurrent_users=$3"


time npx playwright test --workers 1 --config case2.config.ts

