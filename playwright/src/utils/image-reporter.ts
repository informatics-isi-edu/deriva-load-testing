import { min, max, mean, median, quantile } from 'simple-statistics'
import fs from 'fs';
import { convertDateToLocal } from './helpers';

export class ImageTestReportService {
  private static FULL_REPORT_FILE_LOCATION = 'test-report.json';

  static getFullReport(): any {
    try {
      const rep = fs.readFileSync(ImageTestReportService.FULL_REPORT_FILE_LOCATION, 'utf8');
      return JSON.parse(rep);
    } catch (exp) {
      console.log('couldn\'t find any existing report, going to create a new one.');
      return {};
    }
  }

  static saveFullReport(obj: any) {
    const content = JSON.stringify(obj, undefined, 2);
    fs.writeFileSync(ImageTestReportService.FULL_REPORT_FILE_LOCATION, content);
  }

  static processHARFile(harContent: any): any {
    let measuermentHourGroup: string | null = null;
    let runNumber = 0, currRunNumber = 0, min_t0 = 0, max_t1 = 0, curr_t1 = 0;
    let runNumImages = 0, runTotalImageSize = 0;
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

            num_images: runNumImages,
            avg_file_size: runTotalImageSize / runNumImages,
            deriva_duration: max_t1 - min_t0,
            deriva_throughput: (max_t1 - min_t0) / runNumImages,

            num_server_cached_images: runNumServerCached,
            num_browser_cached_images: runNumBrowserCached
          });
        }

        // initialize values for the current run
        currRunNumber = runNumber;
        min_t0 = new Date(e.startedDateTime).getTime();
        max_t1 = min_t0 + e.time;
        runNumImages = 0;
        runTotalImageSize = 0;
        runNumBrowserCached = 0;
        runNumServerCached = 0;
      }

      runNumImages += 1;
      runTotalImageSize += e.response.bodySize;
      curr_t1 = new Date(e.startedDateTime).getTime() + e.time;
      if (curr_t1 > max_t1) max_t1 = curr_t1;
    });

    // for the last group
    currReport.runs.push({
      min_t0: convertDateToLocal(min_t0),

      num_images: runNumImages,
      avg_file_size: runTotalImageSize / runNumImages,
      deriva_duration: max_t1 - min_t0,
      deriva_throughput: (max_t1 - min_t0) / runNumImages,

      num_server_cached_images: runNumServerCached,
      num_browser_cached_images: runNumBrowserCached
    });

    // create summary
    let measuermentTotalImageSize = 0, measurementNumImages = 0,
      measurementTotalDerivaDuration = 0, measurementTotalDerivaThroughput = 0,
      measurementTotalBrowserCached = 0, measurementTotalServerCached = 0;
    currReport.runs.forEach((r) => {
      measurementNumImages += r.num_images;
      measuermentTotalImageSize += (r.avg_file_size * r.num_images);
      measurementTotalDerivaDuration += r.deriva_duration;
      measurementTotalDerivaThroughput += r.deriva_throughput;
      measurementTotalBrowserCached += r.num_browser_cached_images;
      measurementTotalServerCached += r.num_server_cached_images;
    });

    currReport.summary = {
      min_t0: currReport.runs[0].min_t0,
      num_runs: currReport.runs.length,
      num_images: measurementNumImages,

      avg_file_size: measuermentTotalImageSize / measurementNumImages,
      deriva_duration: measurementTotalDerivaDuration / currReport.runs.length,
      deriva_throughput: measurementTotalDerivaThroughput / currReport.runs.length,
      num_server_cached_images: measurementTotalBrowserCached,
      num_browser_cached_images: measurementTotalServerCached
    };

    return currReport;
  }

  static addToFullReport(currRun: any) : any {
    let fullReport = ImageTestReportService.getFullReport();

    const key = new Date(currRun.summary.min_t0).getHours();

    if (!(key in fullReport)) {
      fullReport[key] = {
        summary: {
          num_measurements: 1,

          num_images: currRun.summary.num_images,
          avg_file_size: currRun.summary.avg_file_size,
          deriva_duration: currRun.summary.deriva_duration,
          deriva_throughput: currRun.summary.deriva_throughput,
          num_server_cached_images: currRun.summary.num_server_cached_images,
          num_browser_cached_images: currRun.summary.num_browser_cached_images
        },
        measurements: [
          currRun
        ]
      };
    } else {
      const prevReportForKey = fullReport[key];

      let totalNumImages = prevReportForKey.summary.num_images + currRun.summary.num_images;
      let totalFileSize = 0, totalDerivaDuration = 0, totalDerivaThroughput = 0, totalNumRuns = 0;

      prevReportForKey.measurements.push(currRun);
      prevReportForKey.measurements.forEach((m) => {
        totalFileSize += (m.summary.avg_file_size * m.summary.num_images),
        totalDerivaDuration += m.summary.deriva_duration,
        totalDerivaThroughput += m.summary.deriva_throughput,
        totalNumRuns += m.summary.num_runs;
      })

      const newSummary = {
        num_measurements: prevReportForKey.summary.num_measurements + 1,
        num_images: totalNumImages,
        avg_file_size: totalFileSize / totalNumImages,
        deriva_duration: totalDerivaDuration / totalNumRuns,
        deriva_throughput: totalDerivaThroughput / totalNumRuns,
        num_server_cached_images: prevReportForKey.summary.num_server_cached_images + currRun.summary.num_server_cached_images,
        num_browser_cached_images: prevReportForKey.summary.num_server_cached_images + currRun.summary.num_browser_cached_images
      };
      prevReportForKey.summary = newSummary;

    }

    ImageTestReportService.saveFullReport(fullReport);
  }

}
