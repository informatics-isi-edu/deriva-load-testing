
module.exports = async ({
  core
}) => {
  const CURR_REPORT_FILE_LOCATION = './playwright/.temp-report';
  const FULL_REPORT_FILE_LOCATION = './playwright/test-report.json';

  const ss = require('simple-statistics');
  const fs = require('fs');

  const createSummaryList = (inp) => {
    const arr = inp.map((val) => parseFloat(val));
    return [
      `count: ${arr.length}`,
      `min: ${ss.min(arr).toFixed(3)}`,
      `max: ${ss.max(arr).toFixed(3)}`,
      `mean: ${ss.mean(arr).toFixed(3)}`,
      `median: ${ss.median(arr).toFixed(3)}`,
      `p95: ${ss.quantile(arr, .95).toFixed(3)}`,
      `p99: ${ss.quantile(arr, .99).toFixed(3)}`,
    ];
  };

  const addRepToSummary = (rep) => {
    core.summary.addHeading('Page load', '3');
    core.summary.addList(createSummaryList(rep.page_load));

    core.summary.addHeading('All images load', '3');
    core.summary.addList(createSummaryList(rep.all_images_load));

    core.summary.addHeading('Individual image load time', '3');
    core.summary.addList(createSummaryList(rep.image_load_time));

    core.summary.addHeading('Individual image size', '3');
    core.summary.addList(createSummaryList(rep.image_size));
  }

  try {
    let rep = fs.readFileSync(CURR_REPORT_FILE_LOCATION, 'utf8');
    rep = JSON.parse(rep);

    core.summary.addHeading('Current run', '2');
    core.summary.addRaw(`time: ${rep.iso_time}`, true);
    core.summary.addRaw(`browser cache: ${rep.has_browesr_cache}`, true);
    core.summary.addRaw(`server cache: ${rep.has_server_cache}`, true);
    addRepToSummary(rep);

  } catch (exp) {
    core.notice('Unable to create the current run summary!');
    core.info(exp);
  }

  try {
    let rep = fs.readFileSync(FULL_REPORT_FILE_LOCATION, 'utf8');
    rep = JSON.parse(rep);

    let overalRep = {
      page_load: [],
      all_images_load: [],
      image_load_time: [],
      image_size: []
    };
    let hasBrowserCache = false, hasServerCache = false;

    rep.forEach((r) => {
      overalRep.page_load.push(...r.page_load);
      overalRep.all_images_load.push(...r.all_images_load);
      overalRep.image_load_time.push(...r.image_load_time);
      overalRep.image_size.push(...r.image_size);
      if (r.has_browesr_cache) {
        hasBrowserCache = true;
      }
      if (r.has_server_cache) {
        hasServerCache = true;
      }
    });

    core.summary.addHeading('Full report', '2');
    core.summary.addRaw(`number of runs: ${rep.length}`, true);
    core.summary.addRaw(`browser cache: ${hasBrowserCache}`, true);
    core.summary.addRaw(`server cache: ${hasServerCache}`, true);
    addRepToSummary(overalRep);
  } catch (exp) {
    core.notice('Unable to create the full report summary!');
    core.info(exp);
  }

}
