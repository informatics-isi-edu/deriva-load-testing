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

## Scripts

The following are the prepared scripts and how to run each:

### Image table

This is designed to report how long it took for the image table to show the images.


Before running the command make sure in the `playwright.config.ts`, the setup and teardown scripts are definde properly (no globalSetup is needed):

```
globalSetup: require.resolve('./src/utils/image.setup'),
globalTeardown: require.resolve('./src/utils/image.teardown')
```

To run this,

```
npx playwright test image
```

The following environment variables can be used to customize this script:

- `LOAD_TEST_RELOAD_COUNT`: How many times we should reload the page (default: 10).
- `LOAD_TEST_PAGE_SIZE`: What is the page size (default: 100).
- `LOAD_TEST_CHAISE_URL`: the image recordset url (has no default and is needed)
- `LOAD_TEST_ERMREST_MAIN_URL_PREFIX`: the ermrest url prefix that can be used to identify the main request (has no default and is needed).
- `LOAD_TEST_HATRAC_URL_PREFIX`: the prefix of hatrac urls (has no default and is needed).
- `LOAD_TEST_CLIENT_NAME`: is used for saving the report in the database.
- `LOAD_TEST_AUTH_COOKIE`: is used for saving the report in the database.


### Recordset table

This is designed to report the performance of a recordset page. It will open a recordset page and report how long each step took.

Before running the command make sure in the `playwright.config.ts`, the setup and teardown scripts are definde properly:

```
globalSetup: require.resolve('./src/utils/playwright.setup'),
globalTeardown: require.resolve('./src/utils/playwright.teardown')
```

To run this,

```
npx playwright test recordset
```



