import fs from 'fs';
import axios from 'axios';
import { convertDateToLocal, REPORT_TABLES } from './helpers';

export class ImageReporter {
  static REPORT_LOCATION = 'test-report-unsigned.json';

  static getFullReport(): any {
    try {
      const rep = fs.readFileSync(ImageReporter.REPORT_LOCATION, 'utf8');
      return JSON.parse(rep);
    } catch (exp) {
      console.log('couldn\'t find any existing report, going to create a new one.');
      return {};
    }
  }

  static saveFullReport(obj: any) {
    const content = JSON.stringify(obj, undefined, 2);
    fs.writeFileSync(ImageReporter.REPORT_LOCATION, content);
  }

  static processHARFile(harContent: any): any {
    let measuermentHourGroup: string | null = null;
    let runNumber = 0, currRunNumber = 0, min_t0 = 0, max_t1 = 0, curr_t1 = 0;
    let runNumFiles = 0, runTotalImageSize = 0, runNumRedirectRequests = 0;
    let runNumBrowserCached = 0, runNumServerCached = 0;
    let currReport: any = {
      summary: {},
      runs: []
    };

    harContent.log.entries.forEach((e: any) => {
      if (measuermentHourGroup === null) {
        measuermentHourGroup = new Date(convertDateToLocal(e.startedDateTime)).getHours().toString();
      }

      if (!e.request || e.request.method !== 'GET') return;
      if (e.request.url.startsWith(process.env.LOAD_TEST_ERMREST_MAIN_URL_PREFIX)) {
        runNumber++;
      }

      // the first group is the initial load which we don't care about.
      if (runNumber < 2) return;

      const isImage = e.request.url.startsWith(process.env.LOAD_TEST_HATRAC_URL_PREFIX) && e.time !== -1;

      // the hatrac images
      if (!isImage) return;

      if (e.response && e.response.status === 304) {
        runNumBrowserCached++
        return;
      }

      if (e.response && e.response.bodySize === 0) {
        runNumServerCached++;
        return;
      }

      // we've now started a new group
      if (runNumber !== currRunNumber) {
        // add the previous run before capturing the current run
        if (runNumber !== 2) {
          currReport.runs.push({
            min_t0: convertDateToLocal(min_t0),

            num_files: runNumFiles,
            avg_file_size: runTotalImageSize / runNumFiles,
            unsigned_url_duration: max_t1 - min_t0,
            unsigned_url_throughput: (max_t1 - min_t0) / runNumFiles,

            num_server_cached_images: runNumServerCached,
            num_browser_cached_images: runNumBrowserCached,

            num_signed: runNumRedirectRequests
          });
        }

        // initialize values for the current run
        currRunNumber = runNumber;
        min_t0 = new Date(e.startedDateTime).getTime();
        max_t1 = min_t0 + e.time;
        runNumFiles = 0;
        runTotalImageSize = 0;
        runNumBrowserCached = 0;
        runNumServerCached = 0;
        runNumRedirectRequests = 0;
      }

      // we expect this request to be 200, but it was 303 report it
      if (e.response && e.response.status === 303) {
        runNumRedirectRequests += 1;
      }

      runNumFiles += 1;
      runTotalImageSize += e.response.bodySize;
      curr_t1 = new Date(e.startedDateTime).getTime() + e.time;
      if (curr_t1 > max_t1) max_t1 = curr_t1;
    });

    // for the last group
    currReport.runs.push({
      min_t0: convertDateToLocal(min_t0),

      num_files: runNumFiles,
      avg_file_size: runTotalImageSize / runNumFiles,
      unsigned_url_duration: max_t1 - min_t0,
      unsigned_url_throughput: (max_t1 - min_t0) / runNumFiles,

      num_server_cached_images: runNumServerCached,
      num_browser_cached_images: runNumBrowserCached,

      num_signed: runNumRedirectRequests
    });

    // create summary
    let measuermentTotalImageSize = 0, measurementNumFiles = 0, measurementNumSigned = 0,
      measurementTotalUnsignedURLDuration = 0, measurementTotalUnsignedURLThroughput = 0,
      measurementTotalBrowserCached = 0, measurementTotalServerCached = 0;
    currReport.runs.forEach((r) => {
      measurementNumFiles += r.num_files;
      measuermentTotalImageSize += (r.avg_file_size * r.num_files);
      measurementTotalUnsignedURLDuration += r.unsigned_url_duration;
      measurementTotalUnsignedURLThroughput += r.unsigned_url_throughput;
      measurementTotalBrowserCached += r.num_browser_cached_images;
      measurementTotalServerCached += r.num_server_cached_images;
      measurementNumSigned += r.num_signed;
    });

    currReport.summary = {
      min_t0: currReport.runs[0].min_t0,
      num_runs: currReport.runs.length,
      num_files: measurementNumFiles,

      avg_file_size: measuermentTotalImageSize / measurementNumFiles,
      unsigned_url_duration: measurementTotalUnsignedURLDuration / currReport.runs.length,
      unsigned_url_throughput: measurementTotalUnsignedURLThroughput / currReport.runs.length,

      num_server_cached_images: measurementTotalBrowserCached,
      num_browser_cached_images: measurementTotalServerCached,

      num_signed: measurementNumSigned
    };

    return currReport;
  }

  static addToFullReport(currRun: any) : any {
    let fullReport = ImageReporter.getFullReport();

    const key = new Date(currRun.summary.min_t0).getHours();

    if (!(key in fullReport)) {
      fullReport[key] = {
        summary: {
          num_measurements: 1,

          num_files: currRun.summary.num_files,
          avg_file_size: currRun.summary.avg_file_size,
          unsigned_url_duration: currRun.summary.unsigned_url_duration,
          unsigned_url_throughput: currRun.summary.unsigned_url_throughput,
          num_server_cached_images: currRun.summary.num_server_cached_images,
          num_browser_cached_images: currRun.summary.num_browser_cached_images,
          num_signed: currRun.summary.num_signed
        },
        measurements: [
          currRun
        ]
      };
    } else {
      const prevReportForKey = fullReport[key];

      let totalNumFiles = prevReportForKey.summary.num_files + currRun.summary.num_files;
      let totalNumSigned = prevReportForKey.summary.num_signed + currRun.summary.num_signed;
      let totalFileSize = 0, totalUnsignedURLDuration = 0, totalUnsignedURLThroughput = 0, totalNumRuns = 0;

      prevReportForKey.measurements.push(currRun);
      prevReportForKey.measurements.forEach((m) => {
        totalFileSize += (m.summary.avg_file_size * m.summary.num_files),
        totalUnsignedURLDuration += m.summary.unsigned_url_duration,
        totalUnsignedURLThroughput += m.summary.unsigned_url_throughput,
        totalNumRuns += m.summary.num_runs;
      })

      const newSummary = {
        num_measurements: prevReportForKey.summary.num_measurements + 1,
        num_files: totalNumFiles,
        avg_file_size: totalFileSize / totalNumFiles,
        unsigned_url_duration: totalUnsignedURLDuration / totalNumRuns,
        unsigned_url_throughput: totalUnsignedURLThroughput / totalNumRuns,
        num_server_cached_images: prevReportForKey.summary.num_server_cached_images + currRun.summary.num_server_cached_images,
        num_browser_cached_images: prevReportForKey.summary.num_server_cached_images + currRun.summary.num_browser_cached_images,
        num_signed: totalNumSigned
      };
      prevReportForKey.summary = newSummary;

    }

    ImageReporter.saveFullReport(fullReport);
  }

  static async saveInDB(currRun: any) {
    const data = currRun.runs.map((r) => {
      return {
        // min_t0: new Date(r.min_t0).toISOString(),
        min_t0: r.min_t0,
        time_of_day: new Date(currRun.summary.min_t0).getHours(),
        client: process.env.LOAD_TEST_CLIENT_NAME,
        file_size_label: process.env.LOAD_TEST_FILE_SIZE_LABEL,
        num_files: r.num_files,
        avg_file_size: r.avg_file_size,
        unsigned_url_throughput: r.unsigned_url_throughput,
        num_server_cached_images: r.num_server_cached_images,
        num_browser_cached_images: r.num_browser_cached_images,
        num_signed: r.num_signed
      };
    });

    try {
      const { data: res } = await axios.post(REPORT_TABLES.UNSIGNED, data, { headers: { Cookie: process.env.LOAD_TEST_AUTH_COOKIE } });
      console.log('saved the report in the database.');
    } catch (err) {
      console.log('unable to save the report in the database.');
      console.log(err);
    }
  }

}
