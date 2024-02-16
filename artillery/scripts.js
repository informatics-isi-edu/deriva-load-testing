


async function checkDerivaPageLoad(page, userContext, events, test) {

  await test.step('navbar_load', async () => {
    await page.goto('https://staging.atlas-d2k.org/chaise/recordset/#2/Gene_Expression:Image@sort(RID)?limit=200');
    await page.locator('#mainnav').waitFor({ state: 'visible' });
  })

  await test.step('main_data_load', async () => {
    await page.locator('.recordset-table').waitFor({ state: 'visible' });
    await page.locator('.recordest-main-spinner').waitFor({ state: 'detached' });
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
  });
}

module.exports = {
  checkDerivaPageLoad
};
