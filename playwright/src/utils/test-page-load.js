const {
  pickARandomChaisePerformanceURL, SERVER_LOCATION,
  waitForRecordsetMainData, waitForRecordsetSecondaryData,
  waitForRecordMainData, waitForRecordSecondaryData
} = require("./helpers");

const seed = parseInt(process.env.LOAD_TEST_SEED);

async function testChaisePageLoad(page, userContext, events, test) {
  // disable cache
  page.route('**', route => route.continue());

  let urlProps = pickARandomChaisePerformanceURL(seed);

  await test.step('navbar_load', async () => {
    await page.goto(SERVER_LOCATION + urlProps.url);
    await waitForNavbar(page);
  });

  await test.step('main_data_load', async () => {
    if (urlProps.app === 'recordset') {
      await waitForRecordsetMainData(page);
    } else {
      await waitForRecordMainData(page);
    }
  });

  await test.step('full_page_load', async () => {
    if (urlProps.app === 'recordset') {
      await waitForRecordsetSecondaryData(page);
    } else {
      await waitForRecordSecondaryData(page);
    }
  });
}

module.exports = {
  testChaisePageLoad
};
