import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Read from default ".env" file.
dotenv.config({ override: true });

const clientName = process.env.LOAD_TEST_CLIENT_NAME;
const cookie = process.env.LOAD_TEST_AUTH_COOKIE;
if (!clientName || !cookie) {
 throw new Error('LOAD_TEST_CLIENT_NAME and LOAD_TEST_AUTH_COOKIE are needed');
}
console.log(`client name: ${clientName}\nauth cookie: ${cookie}`);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './src/test-scripts',

  fullyParallel: true,

  timeout: 10 * 60 * 1000,

  retries: 0,

  reporter: [['list', { printSteps: true }]],

  globalSetup: require.resolve('./src/utils/image.setup'),
  globalTeardown: require.resolve('./src/utils/image.teardown'),

  use: {
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
        contextOptions: {
          recordHar: {
            path: './test.har',
            // without the following the HAR file would be too large and in some cases would throw "RangeError: Invalid string length"
            content: 'omit'
          }
        }
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
