const {
  pickARandomChaisePerformanceURL, SERVER_LOCATION,
  waitForNavbar, waitForRecordsetMainData, waitForRecordsetSecondaryData,
  waitForRecordMainData, waitForRecordSecondaryData
} = require("./helpers");

const seed = parseInt(process.env.LOAD_TEST_SEED);

async function testChaisePageLoad(page, userContext, events, test) {
  // disable cache
  page.route('**', route => route.continue());

  let urlProps = pickARandomChaisePerformanceURL(seed);

  await test.step('navbar_load', async () => {
    const url = SERVER_LOCATION + urlProps.url;
    // console.log(url)
    await page.goto(url);
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
