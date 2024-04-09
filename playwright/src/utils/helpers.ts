export function interval(start, end) {
  return end - start;
}


export const waitForImages = async (page) => {
  /**
   * wait for thumbnails to load
   * https://github.com/microsoft/playwright/issues/6046
   */
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.every(img => img.complete && img.naturalWidth !== 0);
  });
};

export const waitForRecordsetMainData = async (page) => {
  await page.locator('.recordset-table').waitFor({ state: 'visible' });
  await page.locator('.recordest-main-spinner').waitFor({ state: 'detached' });
}

export const convertDateToLocal = (date: any) => {
  return new Date(date).toLocaleString("en-US", { timeZone: 'America/Los_Angeles' })
}
