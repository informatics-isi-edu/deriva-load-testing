import { Page } from "@playwright/test";

export function interval(start: number, end: number) {
  return end - start;
}


export const waitForImages = async (page: Page, timeout?: number) => {
  /**
   * wait for thumbnails to load
   * https://github.com/microsoft/playwright/issues/6046
   */
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.every(img => img.complete && img.naturalWidth !== 0);
  }, undefined, { timeout });
};

export const waitForRecordsetMainData = async (page) => {
  await page.locator('.recordset-table').waitFor({ state: 'visible' });
  await page.locator('.recordest-main-spinner').waitFor({ state: 'detached' });
}

export const convertDateToLocal = (date: any) => {
  return new Date(date).toLocaleString("en-US", { timeZone: 'America/Los_Angeles' })
}


export const REPORT_TABLES = {
  // SIGNED: 'https://dev.derivacloud.org/ermrest/catalog/83752/entity/load-testing:signed_url_experiment',
  // UNSIGNED: 'https://dev.derivacloud.org/ermrest/catalog/83752/entity/load-testing:unsigned_url_experiment',
  SIGNED: 'https://dev.derivacloud.org/ermrest/catalog/83773/entity/load-testing:signed_url_experiment',
  UNSIGNED: 'https://dev.derivacloud.org/ermrest/catalog/83773/entity/load-testing:unsigned_url_experiment',
}
