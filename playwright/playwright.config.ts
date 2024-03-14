import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './src/test-scripts',

  fullyParallel: true,

  timeout: 60 * 1000,

  retries: 0,

  reporter: 'dot',

  globalSetup: require.resolve('./src/utils/image.setup'),
  globalTeardown: require.resolve('./src/utils/image.teardown'),

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: { recordHar: { path: './image-test.har'}}
      },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ]
});
