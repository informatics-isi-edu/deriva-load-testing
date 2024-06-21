/**
 *
 * go to a random recordset page, reload the page multiple times.
 *
 */
import { test } from '@playwright/test';
import {
  REPORT_TABLES, SERVER_LOCATION,
  convertDateToLocal, interval, shuffleChaisePerformanceURLs,
  waitForImages, waitForRecordsetSecondaryData, waitForRecordsetMainData,
  waitForNavbar,
  waitForRecordMainData,
  waitForRecordSecondaryData
} from '../utils/helpers';
import axios from 'axios';

type ReportType = {
  app: string, page_identifier: string, min_t0: any,
  navbar_load: number, main_data_load: number, full_page_load: number,
};

const seed = parseInt(process.env.LOAD_TEST_SEED!);
const urls = shuffleChaisePerformanceURLs(seed);
const pageSize = 25;

const allReports: ReportType[] = [];

test('open chaise pages', async ({ page, browser, browserName }) => {

  // make sure the timeout is based on the number of urls
  test.setTimeout((urls.length * 2) * 60 * 1000);

  // disable cache
  // page.route('**', route => route.continue());

  for await (const [i, urlProps] of urls.entries()) {
    let report : any = {}, startTime : number;
    report['app'] = urlProps.app;
    report['page_identifier'] = urlProps.identifier;

    await test.step(`${urlProps.identifier}: navbar_load`, async () => {
      report['min_t0'] = convertDateToLocal(new Date());
      startTime = performance.now();
      await page.goto(SERVER_LOCATION + urlProps.url);
      await waitForNavbar(page);
      report['navbar_load'] = interval(startTime, performance.now());
    });

    await test.step(`${urlProps.identifier}: main_data_load`, async () => {
      if (urlProps.app === 'recordset') {
        await waitForRecordsetMainData(page);
      } else {
        await waitForRecordMainData(page);
      }
      report['main_data_load'] = interval(startTime, performance.now());
    });

    await test.step(`${urlProps.identifier}: full_page_load`, async () => {
      if (urlProps.app === 'recordset') {
        await waitForRecordsetSecondaryData(page);
      } else {
        await waitForRecordSecondaryData(page);
      }
      report['full_page_load'] = interval(startTime, performance.now());
      allReports.push(report);
    });
  }

});

test.afterAll(async () => {
  // save allReports in the db
  const sessionID = new Date(allReports[0].min_t0).valueOf();
  const data = allReports.map((r) => {
    return {
      session_id: sessionID,
      min_t0: r['min_t0'],
      time_of_day: new Date(r['min_t0']).getHours(),
      client: process.env.LOAD_TEST_CLIENT_NAME,
      infrastructure: process.env.LOAD_TEST_INFRASTRUCTURE,
      num_concurrent_users: process.env.LOAD_TEST_NUM_CONCURRENT_USERS,
      seed: seed,
      app: r['app'],
      page_identifier: r['page_identifier'],
      navbar_load: r['navbar_load'],
      main_data_load: r['main_data_load'],
      full_page_load: r['full_page_load']
    }
  });

  console.log(data);

  // try {
  //   const { data: res } = await axios.post(REPORT_TABLES.CHAISE_PERFORMANCE, data, { headers: { Cookie: process.env.LOAD_TEST_AUTH_COOKIE } });
  //   console.log('saved the report in the database.');
  // } catch (err) {
  //   console.log('unable to save the report in the database.');
  //   console.log(err);
  // }

});
