# Loading testing with Playwright

This folder contains several test scenarios that we can run to evaluate the performance of chaise pages.

## Prerequisites
If you're running this on a fresh Ubuntu installation, you first need to install `make` and `nodejs`. The following is how I would do it:

1. Install `make`
```
sudo apt update
sudo apt install make
```

2. Follow [these instructions](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script) to install nvm and install the latest nodejs.


## Installation

Before running the scripts, you need to install the dependencies by running the following

```
make deps
```

## `.env` file

There are two environment variables that are needed for both scripts. To make defining these variables easiers, we're using the `.env` file:

1. Create a `.env` file by douplicating the `.env-sample`.
2. Change the `LOAD_TEST_AUTH_COOKIE` to be the cookie of the user that has write access to the `cloud_testing` catalog.
3. Change `LOAD_TEST_CLIENT_NAME` to describe the current client.

## Scripts

The following are the prepared scripts and how to run each:

### Case 1

In this experiment, we open the given chaise page and report how long it took for all the images to show up. We're using Playwright to generate a HAR file for us and then the analysis is done based on this file.

To run this for a "signed" case:

```
./case-1-experiment.sh true
```

And for "unsigned":

```
./case-2-experiment.sh false
```


### Case 2

This is designed to report the performance of a recordset and record pages. Each time this script is called is called a "measurement". Each measurement consists of one or multiple "run"s. In each run we're going to open one or multipl chaise pages. For each page visit we will report how long it took to each milestone (in milliseconds). Each page visit will be stored in a different row in the database.

You can run this by calling `case_2_experiment.sh` with the following arguments:

1. The chaise base url.
2. The `batch_id` of the experiment.
3. Number of runs (repetitions).
4. The seed that we should use for randomizing the order of pages.
5. Page size (how many pages we should go through).
6. The use case label (only used for storing in the database).
7. Number of background users (only used for storing in the database).
8. (optional) Whether we should skip saving in the database or not
9. (optional) Number of workers that playwright should use for parallelism.

For instance

```
./case_2_experiment.sh "https://staging.atlas-d2k.org/~ashafaei/chaise-load-testing/"  "$(uuidgen)" 2 12 4 "test-chaise-manual" 0
```
