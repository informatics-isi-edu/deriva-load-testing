/**
 *
 * how long it took to load all the images on the page.
 * the time it took from the load of the first image until the last image...
 *
 */
import { test } from '@playwright/test';
import { performance } from 'perf_hooks';
import { interval, waitForImages, waitForRecordsetMainData } from '../utils/helpers';
import { ImageTestReport, ImageTestReportService } from '../utils/image-reporter';

let reloadCount = parseInt(process.env.TEST_COUNT!);
if (isNaN(reloadCount) || reloadCount <= 1) {
  reloadCount = 1;
}
process.env.TEST_COUNT = reloadCount;

let pageSize = parseInt(process.env.PAGE_SIZE!)
if (isNaN(pageSize)) {
  pageSize = 100;
}

let startTime, endTime;

const report = new ImageTestReport();

test('load image table and note the image load time', async ({ page }) => {
  // disable cache
  page.route('**', route => route.continue());

  await test.step('go to recordset page', async () => {
    console.log(`page size=${pageSize}, reload count=${reloadCount}`);

    const url = [
      'https://dev.atlas-d2k.org/chaise/recordset/#2/Gene_Expression:Image/',
      '*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM4gBUALNAWwCMIwBLAGwH0AhATwBcckQAaEDSAcw5xEIUtQj4AjAAYATABZuo8fRwAPLLTRJqANzyxWGNDgC+AXQumgA@sort(RID)',
      '?limit=' + pageSize
    ].join('');

    await page.goto(url);
    await waitForRecordsetMainData(page);
  });

  for (let i = 0; i < reloadCount; i++) {
    await test.step(`${i}: page load`, async () => {

      startTime = performance.now();
      await page.reload();
      await waitForRecordsetMainData(page);

      endTime = performance.now();
      report.pw_page_load.push(interval(startTime, endTime));
      startTime = endTime;
    });

    await test.step(`${i}: all images load`, async () => {
      await waitForImages(page);

      endTime = performance.now();
      report.pw_all_images_load.push(interval(startTime, endTime));
      startTime = endTime;

      if (i === reloadCount - 1) {
        ImageTestReportService.saveCurrentReport(report);
      }
    });
  }
});


/**
 * do peak hour and then non-peak hour
 *
 * most probably the raw data should have the start time, ellapsed time, etc...
 *
 * we will run this in multiple time of the day and each will be marked whether it's peak or not.
 */
