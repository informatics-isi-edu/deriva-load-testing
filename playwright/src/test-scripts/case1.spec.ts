/**
 *
 * go to recordset page for image, wait for images to load, reload the page multiple times.
 *
 */
import { test } from '@playwright/test';
import { waitForImages, waitForRecordsetMainData } from '../utils/helpers';

let reloadCount = parseInt(process.env.LOAD_TEST_RELOAD_COUNT!);
if (isNaN(reloadCount)) {
  reloadCount = 10;
}

let pageSize = parseInt(process.env.LOAD_TEST_PAGE_SIZE!)
if (isNaN(pageSize)) {
  pageSize = 100;
}

test('load image table and note the image load time', async ({ page, browser, browserName }) => {
  // make sure the timeout is a function of the number of reloads.
  test.setTimeout((reloadCount * 2) * 60 * 1000);

  // disable cache
  page.route('**', route => route.continue());

  await test.step('go to recordset page', async () => {
    const url = process.env.LOAD_TEST_CHAISE_URL + '?limit=' + pageSize;

    console.log(`browser information: ${browserName} ${browser.version()}`);
    console.log(`chaise url: ${url}`);

    await page.goto(url);
    await waitForRecordsetMainData(page);
  });

  if (reloadCount === 0) {
    await test.step('wait for all images to load', async () => {
      await waitForImages(page, pageSize * 1000);
    });
  }

  for (let i = 0; i < reloadCount; i++) {
    await test.step(`${i}: page load`, async () => {
      await page.reload();
      await waitForRecordsetMainData(page);
    });

    await test.step(`${i}: all images load`, async () => {
      await waitForImages(page, pageSize * 1000);
    });
  }
});
