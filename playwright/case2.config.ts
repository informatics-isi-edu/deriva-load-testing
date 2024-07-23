import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Read from default ".env" file.
dotenv.config({ override: true });

const clientName = process.env.LOAD_TEST_CLIENT_NAME;
const cookie = process.env.LOAD_TEST_AUTH_COOKIE;
if (!clientName || !cookie) {
 throw new Error('LOAD_TEST_CLIENT_NAME and LOAD_TEST_AUTH_COOKIE are needed');
}
// console.log(`client name: ${clientName}\nauth cookie: ${cookie}`);

const saveToDB = process.env.LOAD_TEST_SKIP_REPORT_SAVE != 'true';

const requiredVariables = saveToDB ? {
  'batch_id': 'LOAD_TEST_BATCH_ID',
  'number of runs': 'LOAD_TEST_NUM_RUNS',
  'seed': 'LOAD_TEST_SEED',
  'page size': 'LOAD_TEST_PAGE_SIZE',
  'use_case': 'LOAD_TEST_USE_CASE_LABEL',
  'number of background users': 'LOAD_TEST_NUM_BG_USERS'
} : {
  'number of runs': 'LOAD_TEST_NUM_RUNS',
  'seed': 'LOAD_TEST_SEED',
  'page size': 'LOAD_TEST_PAGE_SIZE',
};

for (const k in requiredVariables) {
  if (!process.env[requiredVariables[k]]) {
    throw new Error(`${k} is not defined (${requiredVariables[k]} env variable is missing)`);
  }
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './src/test-scripts',

  testMatch: 'case2.spec.ts',

  // globalTeardown: require.resolve('./src/utils/check-cache.teardown'),

  fullyParallel: true,

  timeout: 10 * 60 * 1000 * parseInt(process.env.LOAD_TEST_NUM_RUNS!),

  retries: 0,

  reporter: [['list', { printSteps: true }]],

  use: {
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
        // contextOptions: {
        //   recordHar: {
        //     path: './case2-test.har',
        //     // without the following the HAR file would be too large and in some cases would throw "RangeError: Invalid string length"
        //     content: 'omit'
        //   }
        // }
      },
    },
  ]
});
