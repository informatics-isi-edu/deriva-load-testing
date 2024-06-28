import { test } from '@playwright/test';
import axios from 'axios';
import {
  REPORT_TABLES,
  convertDateToLocal, interval, shuffleChaisePerformanceURLs,
  waitForRecordsetSecondaryData, waitForRecordsetMainData,
  waitForNavbar, waitForRecordMainData, waitForRecordSecondaryData
} from '../utils/helpers';

type ReportType = {
  app: string, page_identifier: string, min_t0: any, run_number: number,
  navbar_load: number, main_data_load: number, full_page_load: number,
  navbar_load_chaise_manual: number, main_data_load_chaise_manual: number, full_page_load_chaise_manual: number,
};

const baseURL = process.env.LOAD_TEST_CHAISE_URL;
const saveToDB = process.env.LOAD_TEST_SKIP_REPORT_SAVE != 'true';
const numRuns = parseInt(process.env.LOAD_TEST_NUM_RUNS!);
const seed = parseInt(process.env.LOAD_TEST_SEED!);
const urls = shuffleChaisePerformanceURLs(seed, parseInt(process.env.LOAD_TEST_PAGE_SIZE!));

const allReports: ReportType[] = [];

for (let runNumber = 1; runNumber <= numRuns; runNumber++) {
  for (const [pageOrder, urlProps] of urls.entries()) {
    test(`${runNumber}, ${pageOrder + 1}: open ${urlProps.app}, ${urlProps.identifier}`, async ({ page }) => {
      test.setTimeout(60 * 1000);

      let report: any = {}, startTime: number, hasError: boolean, reportedFullPageLoad = -1, temp;
      report = { ...urlProps };
      report['page_order'] = pageOrder + 1;
      report['run_number'] = runNumber;

      // capture the manually reported times in console
      page.on('console', msg => {
        if (!saveToDB || msg.type() !== 'log') return;
        const text = msg.text();
        if (text.startsWith('navbar_load_chaise_manual')) {
          report['navbar_load_chaise_manual'] = parseFloat(text.slice(27));
        }
        if (text.startsWith('main_data_load_chaise_manual')) {
          report['main_data_load_chaise_manual'] = parseFloat(text.slice(30));
        }
        if (text.startsWith('full_page_load_chaise_manual')) {
          report['full_page_load_chaise_manual'] = parseFloat(text.slice(30));
        }
        /**
         * in recordset case we don't know which happens first (or if there's even any aggregates), so wre look for both
         */
        if (report['app'] === 'recordset') {
          let facets = text.startsWith('all_facets_loaded_chaise_manual');
          let aggregates = text.startsWith('all_aggregates_loaded_chaise_manual');
          if (facets || aggregates) {
            temp = parseFloat(text.slice(facets ? 33 : 37));
            if (temp > reportedFullPageLoad) {
              reportedFullPageLoad = temp;
              report['full_page_load_chaise_manual'] = temp;
            }
          }

          /**
           * since we're sending facet and main request at the same time, we might get the facet result before the main one.
           * so in herer we're going to correct that.
           */
          if (report['main_data_load_chaise_manual'] > report['full_page_load_chaise_manual']) {
            report['full_page_load_chaise_manual'] = report['main_data_load_chaise_manual'];
          }
        }
      });

      report['min_t0'] = convertDateToLocal(new Date());
      startTime = performance.now();
      await page.goto(baseURL + urlProps.url);

      // navbar
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

      // main data
      if (!hasError) {
        try {
          if (urlProps.app === 'recordset') {
            await waitForRecordsetMainData(page);
          } else {
            await waitForRecordMainData(page);
          }
          report['main_data_load'] = interval(startTime, performance.now());
        } catch (exp) {
          hasError = true;
          console.log('error while waiting for main data to load');
          console.error(exp);
          report['main_data_load'] = -1;
        }
      }

      // full page
      if (!hasError) {
        try {
          if (urlProps.app === 'recordset') {
            await waitForRecordsetSecondaryData(page);
          } else {
            await waitForRecordSecondaryData(page);
          }
          report['full_page_load'] = interval(startTime, performance.now());
        } catch (exp) {
          console.log('error while waiting for full page load');
          console.error(exp);
          report['full_page_load'] = -1;
        }
      }

      if (saveToDB) {
        allReports.push(report);
      }
    });
  }
}

test.afterAll(async () => {
  if (!saveToDB) return;

  const data = allReports.map((r) => {
    return {
      batch_id: process.env.LOAD_TEST_BATCH_ID,
      run_number: r['run_number'],
      min_t0: r['min_t0'],
      time_of_day: new Date(r['min_t0']).getHours(),
      client_id: process.env.LOAD_TEST_CLIENT_NAME,
      use_case: process.env.LOAD_TEST_USE_CASE_LABEL,
      num_bg_users: process.env.LOAD_TEST_NUM_BG_USERS,
      seed: seed,
      page_order: r['page_order'],
      page_id: r['identifier'],
      app: r['app'],
      schema_table: r['schema_table'],
      filter: r['filter'],
      navbar_load: r['navbar_load'],
      main_data_load: r['main_data_load'],
      full_page_load: r['full_page_load'],
      navbar_load_chaise_manual: r['navbar_load_chaise_manual'],
      main_data_load_chaise_manual: r['main_data_load_chaise_manual'],
      full_page_load_chaise_manual: r['full_page_load_chaise_manual']
    }
  });

  // console.log(data);

  try {
    await axios.post(REPORT_TABLES.CHAISE_PERFORMANCE, data, { headers: { Cookie: process.env.LOAD_TEST_AUTH_COOKIE } });
    console.log('saved the report in the database.');
  } catch (err) {
    console.log('unable to save the report in the database.');
    console.log(err);
  }
});
