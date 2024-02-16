import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';
import TestReporter from './../utils/reporter';


let num = parseInt(process.env.TEST_COUNT!)
if (isNaN(num)) {
  num = 2;
}

for (let id = 0; id < num; id++) {
  test(`test page load ${id}`, async ({ page }) => {

    let report: any = {}, startTime, endTime;

    await test.step('navbar_load', async () => {
      startTime = performance.now();

      await page.goto('https://staging.atlas-d2k.org/chaise/recordset/#2/Gene_Expression:Image@sort(RID)?limit=200');
      await page.locator('#mainnav').waitFor({ state: 'visible' });

      endTime = performance.now();
      report['navbar'] = ((endTime - startTime) / 1000).toFixed(3);

      startTime = endTime;

    })

    await test.step('main_data_load', async () => {
      await page.locator('.recordset-table').waitFor({ state: 'visible' });
      await page.locator('.recordest-main-spinner').waitFor({ state: 'detached' });

      endTime = performance.now();
      report['main_data'] = ((endTime - startTime) / 1000).toFixed(3);
      startTime = endTime;
    });

    await test.step('all_images_load', async () => {
      /**
       * wait for thumbnails to load
       * https://github.com/microsoft/playwright/issues/6046
       */
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.every(img => img.complete && img.naturalWidth !== 0);
      });

      endTime = performance.now();
      report['all_images'] = ((endTime - startTime) / 1000).toFixed(3);

      TestReporter.addToReport(report);
    });
  });
}





