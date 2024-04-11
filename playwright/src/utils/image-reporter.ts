import { min, max, mean, median, quantile } from 'simple-statistics'
import fs from 'fs';
import { convertDateToLocal } from './helpers';

export class ImageTestReportService {
  private static UNSIGNED_FILE = 'test-report-unsigned.json';
  private static SIGNED_FILE = 'test-report-signed.json';


  static getFullReport(isSigned: boolean): any {
    try {
      const loc = isSigned ? ImageTestReportService.SIGNED_FILE : ImageTestReportService.UNSIGNED_FILE;
      const rep = fs.readFileSync(loc, 'utf8');
      return JSON.parse(rep);
    } catch (exp) {
      console.log('couldn\'t find any existing report, going to create a new one.');
      return {};
    }
  }

  static saveFullReport(obj: any, isSigned: boolean) {
    const content = JSON.stringify(obj, undefined, 2);
    const loc = isSigned ? ImageTestReportService.SIGNED_FILE : ImageTestReportService.UNSIGNED_FILE;
    fs.writeFileSync(loc, content);
  }

  static processHARFile(harContent: any, isSigned: boolean): any {
    let measuermentHourGroup: string | null = null;
    let runNumber = 0, currRunNumber = 0, min_t0 = 0, max_t1 = 0, curr_t1 = 0;
    let runNumFiles = 0, runTotalImageSize = 0;
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
            num_browser_cached_images: runNumBrowserCached
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
      num_browser_cached_images: runNumBrowserCached
    });

    // create summary
    let measuermentTotalImageSize = 0, measurementNumFiles = 0,
      measurementTotalUnsignedURLDuration = 0, measurementTotalUnsignedURLThroughput = 0,
      measurementTotalBrowserCached = 0, measurementTotalServerCached = 0;
    currReport.runs.forEach((r) => {
      measurementNumFiles += r.num_files;
      measuermentTotalImageSize += (r.avg_file_size * r.num_files);
      measurementTotalUnsignedURLDuration += r.unsigned_url_duration;
      measurementTotalUnsignedURLThroughput += r.unsigned_url_throughput;
      measurementTotalBrowserCached += r.num_browser_cached_images;
      measurementTotalServerCached += r.num_server_cached_images;
    });

    currReport.summary = {
      min_t0: currReport.runs[0].min_t0,
      num_runs: currReport.runs.length,
      num_files: measurementNumFiles,

      avg_file_size: measuermentTotalImageSize / measurementNumFiles,
      unsigned_url_duration: measurementTotalUnsignedURLDuration / currReport.runs.length,
      unsigned_url_throughput: measurementTotalUnsignedURLThroughput / currReport.runs.length,
      num_server_cached_images: measurementTotalBrowserCached,
      num_browser_cached_images: measurementTotalServerCached
    };

    return currReport;
  }

  static addToFullReport(currRun: any, isSigned: boolean) : any {
    let fullReport = ImageTestReportService.getFullReport(isSigned);

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
          num_browser_cached_images: currRun.summary.num_browser_cached_images
        },
        measurements: [
          currRun
        ]
      };
    } else {
      const prevReportForKey = fullReport[key];

      let totalNumFiles = prevReportForKey.summary.num_files + currRun.summary.num_files;
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
        num_browser_cached_images: prevReportForKey.summary.num_server_cached_images + currRun.summary.num_browser_cached_images
      };
      prevReportForKey.summary = newSummary;

    }

    ImageTestReportService.saveFullReport(fullReport, isSigned);
  }

}
