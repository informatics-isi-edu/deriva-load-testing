/**
 *
 * how long it took to load all the images on the page.
 * the time it took from the load of the first image until the last image...
 *
 */
import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';
import { interval } from '../utils/helpers';
import TestReporter from './../utils/reporter';

let num = parseInt(process.env.TEST_COUNT!)
if (isNaN(num)) {
  num = 2;
}
let pageSize = parseInt(process.env.PAGE_SIZE!)
if (isNaN(pageSize)) {
  pageSize = 100;
}

let absoulteStartTime, startTime, endTime;




test('load image table and note the image load time', async ({ page }) => {
  absoulteStartTime = performance.now();
  startTime = absoulteStartTime;

  console.log(`page size=${pageSize}`)
  const url = [
    'https://staging.atlas-d2k.org/chaise/recordset/#2/Gene_Expression:Image/',
    '*::facets::N4IghgdgJiBcDaoDOB7ArgJwMYFM4gBUALNAWwCMIwBLAGwH0AhATwBcckQAaEDSAcw5xEIUtQj4AjAAYATABZuo8fRwAPLLTRJqANzyxWGNDgC+AXQumgA@sort(RID)',
    '?limit=' + pageSize
  ].join('');

  await page.goto(url);
  await page.locator('.recordset-table').waitFor({ state: 'visible' });
  await page.locator('.recordest-main-spinner').waitFor({ state: 'detached' });

  endTime = performance.now();
  console.log(`first page load: ${interval(startTime, endTime)}`);
  startTime = endTime;

  /**
   * wait for thumbnails to load
   * https://github.com/microsoft/playwright/issues/6046
   */
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.every(img => img.complete && img.naturalWidth !== 0);
  });

  endTime = performance.now();
  console.log(`first page images: ${interval(startTime, endTime)}`);

  await page.locator('.chaise-table-next-btn').click();
  await page.locator('.recordest-main-spinner').waitFor({ state: 'visible' });
  await page.locator('.recordest-main-spinner').waitFor({ state: 'detached' });

  endTime = performance.now();
  console.log(`second page load: ${interval(startTime, endTime)}`);
  startTime = endTime;


  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.every(img => img.complete && img.naturalWidth !== 0);
  });

  endTime = performance.now();
  console.log(`second page images: ${interval(startTime, endTime)}`);

  console.log(`full runtime: ${interval(absoulteStartTime, endTime)}`);

});



