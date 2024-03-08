# Loading testing with Playwright

This folder contains several test scenarios that we can run to evaluate the performance of chaise pages.

## Installation

Before running the scripts, you need to install the dependencies by running the following

```
npm clean-install
```

## Scripts

The following are the prepared scripts and how to run each:

### Image table

This is designed to report how long it took for the image table to show the images.


Before running the command make sure in the `playwright.config.ts`, the setup and teardown scripts are definde properly (no globalSetup is needed):

```
globalTeardown: require.resolve('./src/utils/image.teardown')
```

To run this,

```
npx playwright test image
```


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



