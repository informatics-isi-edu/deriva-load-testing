/**
 *
 * go to recordset page, wait for images to load, reload the page multiple times.
 *
 */
import { test } from '@playwright/test';
import { waitForImages, waitForRecordsetMainData } from '../utils/helpers';

let reloadCount = parseInt(process.env.LOAD_TEST_RUN_COUNT!);
if (isNaN(reloadCount) || reloadCount <= 1) {
  reloadCount = 10;
}

let pageSize = parseInt(process.env.LOAD_TEST_PAGE_SIZE!)
if (isNaN(pageSize)) {
  pageSize = 100;
}

test('load image table and note the image load time', async ({ page }) => {
  // disable cache
  page.route('**', route => route.continue());

  await test.step('go to recordset page', async () => {
    console.log(`page size=${pageSize}, number of runs=${reloadCount}`);

    const url = process.env.LOAD_TEST_CHAISE_URL + '?limit=' + pageSize;
    console.log(`chaise url:${url}`);

    await page.goto(url);
    await waitForRecordsetMainData(page);
  });

  for (let i = 0; i < reloadCount; i++) {
    await test.step(`${i}: page load`, async () => {
      await page.reload();
      await waitForRecordsetMainData(page);
    });

    await test.step(`${i}: all images load`, async () => {
      await waitForImages(page);
    });
  }
});
