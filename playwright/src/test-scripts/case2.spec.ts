import { test } from '@playwright/test';
import axios from 'axios';
import {
  REPORT_TABLES, SERVER_LOCATION,
  convertDateToLocal, interval, shuffleChaisePerformanceURLs,
  waitForRecordsetSecondaryData, waitForRecordsetMainData,
  waitForNavbar, waitForRecordMainData, waitForRecordSecondaryData
} from '../utils/helpers';

type ReportType = {
  app: string, page_identifier: string, min_t0: any, run_number: number,
  navbar_load: number, main_data_load: number, full_page_load: number,
};

const numRuns = parseInt(process.env.LOAD_TEST_NUM_RUNS!);
const seed = parseInt(process.env.LOAD_TEST_SEED!);
const urls = shuffleChaisePerformanceURLs(seed, parseInt(process.env.LOAD_TEST_PAGE_SIZE!));

const allReports: ReportType[] = [];

for (let runNumber = 1; runNumber <= numRuns; runNumber++) {
  for (const [pageOrder, urlProps] of urls.entries()) {
    test(`${runNumber}, ${pageOrder + 1}: open ${urlProps.app}, ${urlProps.identifier}`, async ({ page }) => {
      test.setTimeout(60 * 1000);

      let report: any = {}, startTime: number, hasError : boolean;
      report = { ...urlProps };
      report['run_number'] = runNumber;

      await test.step(`navbar_load`, async () => {
        report['min_t0'] = convertDateToLocal(new Date());
        startTime = performance.now();
        await page.goto(SERVER_LOCATION + urlProps.url);
        try {
          await waitForNavbar(page);
          report['navbar_load'] = interval(startTime, performance.now());
          hasError = false;
        } catch (exp) {
          console.log('error while waiting for navbar to load');
          console.error(exp);
          report['navbar_load'] = -1;
          report['main_data_load'] = -1;
          report['full_page_load'] = -1;
          hasError = true;
        }
      });

      await test.step(`main_data_load`, async () => {
        if (hasError) return;
        try {
          if (urlProps.app === 'recordset') {
            await waitForRecordsetMainData(page);
          } else {
            await waitForRecordMainData(page);
          }
          report['main_data_load'] = interval(startTime, performance.now());
        } catch (exp) {
          console.log('error while waiting for main data to load');
          console.error(exp);
          report['main_data_load'] = -1;
        }
      });

      await test.step(`full_page_load`, async () => {
        if (hasError) return;
        try {
          if (urlProps.app === 'recordset') {
            await waitForRecordsetSecondaryData(page);
          } else {
            await waitForRecordSecondaryData(page);
          }
          report['full_page_load'] = interval(startTime, performance.now());
          allReports.push(report);
        } catch (exp) {
          console.log('error while waiting for full page load');
          console.error(exp);
          report['full_page_load'] = -1;
        }
      });
    });
  }
}

test.afterAll(async () => {
  const data = allReports.map((r, i) => {
    return {
      batch_id: process.env.LOAD_TEST_BATCH_ID,
      run_number: r['run_number'],
      min_t0: r['min_t0'],
      time_of_day: new Date(r['min_t0']).getHours(),
      client_id: process.env.LOAD_TEST_CLIENT_NAME,
      use_case: process.env.LOAD_TEST_USE_CASE_LABEL,
      num_bg_users: process.env.LOAD_TEST_NUM_BG_USERS,
      seed: seed,
      page_order: i + 1,
      page_id: r['identifier'],
      app: r['app'],
      schema_table: r['schema_table'],
      filter: r['filter'],
      navbar_load: r['navbar_load'],
      main_data_load: r['main_data_load'],
      full_page_load: r['full_page_load']
    }
  });

  const saveToDB = process.env.LOAD_TEST_SKIP_REPORT_SAVE !== 'true';
  if (saveToDB) {
    try {
      await axios.post(REPORT_TABLES.CHAISE_PERFORMANCE, data, { headers: { Cookie: process.env.LOAD_TEST_AUTH_COOKIE } });
      console.log('saved the report in the database.');
    } catch (err) {
      console.log('unable to save the report in the database.');
      console.log(err);
    }
  } else {
    console.log(data);
  }

});
