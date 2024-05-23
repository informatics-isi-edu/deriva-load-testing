import fs from 'fs';
import axios from 'axios';
import { convertDateToLocal, REPORT_TABLES } from './helpers';

export class ImageReporterSigned {
  static REPORT_LOCATION = 'test-report-signed.json';

  static getFullReport(): any {
    try {
      const rep = fs.readFileSync(ImageReporterSigned.REPORT_LOCATION, 'utf8');
      return JSON.parse(rep);
    } catch (exp) {
      console.log('couldn\'t find any existing report, going to create a new one.');
      return {};
    }
  }

  static saveFullReport(obj: any) {
    const content = JSON.stringify(obj, undefined, 2);
    fs.writeFileSync(ImageReporterSigned.REPORT_LOCATION, content);
  }

  static processHARFile(harContent: any): any {
    let measuermentHourGroup: string | null = null;
    let runNumber = 0, currRunNumber = 0, min_t0 = 0, max_t1 = 0, curr_t1 = 0;
    let curr_t3 = 0, max_t3 = 0, min_t2 = 0;
    let runNumFiles = 0, runTotalImageSize = 0, runNumUnsigned = 0;
    let runNumDerivaRequests = 0;
    let runNumBrowserCached = 0, runNumServerCached = 0;
    let currReport: any = {
      summary: {},
      runs: []
    };

    // if we're not reloading this should be 1, if we're reloading this should be 2
    const reloadCount = parseInt(process.env.LOAD_TEST_RELOAD_COUNT!);
    const firstRunNumber = isNaN(reloadCount) || reloadCount > 0 ? 2 : 1;

    harContent.log.entries.forEach((e: any) => {
      if (measuermentHourGroup === null) {
        measuermentHourGroup = new Date(convertDateToLocal(e.startedDateTime)).getHours().toString();
      }

      if (!e.request || e.request.method !== 'GET') return;
      if (e.request.url.startsWith(process.env.LOAD_TEST_ERMREST_MAIN_URL_PREFIX)) {
        runNumber++;
      }

      // the first group is the initial load which we don't care about.
      if (runNumber < firstRunNumber) return;

      const isDerivaRequest = e.request.url.startsWith(process.env.LOAD_TEST_HATRAC_URL_PREFIX) && e.time !== -1;
      const isActualImageRequest = e.request.url.startsWith(process.env.LOAD_TEST_HATRAC_REDIRECT_URL_PREFIX) && e.time !== -1;

      // the hatrac images
      if (!isDerivaRequest && !isActualImageRequest) return;

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
        if (runNumber !== firstRunNumber) {
          currReport.runs.push({
            min_t0: convertDateToLocal(min_t0),

            num_signed: runNumDerivaRequests,
            signed_url_duration: max_t1 - min_t0,
            signed_url_throughput: (max_t1 - min_t0) / runNumDerivaRequests,

            num_files: runNumFiles,
            avg_file_size: runTotalImageSize / runNumFiles,
            min_io_throughput: (max_t3 - min_t2) / runNumFiles,
            client_throughput: (max_t3 - min_t0) / runNumFiles,

            num_server_cached_images: runNumServerCached,
            num_browser_cached_images: runNumBrowserCached,

            num_unsigned: runNumUnsigned
          });
        }

        // initialize values for the current run
        // we can assume that this is the hatrac request.
        currRunNumber = runNumber;
        min_t0 = new Date(e.startedDateTime).getTime();
        max_t1 = min_t0 + e.time;
        runNumDerivaRequests = 0;
        runNumBrowserCached = 0;
        runNumServerCached = 0;

        runNumUnsigned = 0;
        runNumFiles = 0;
        runTotalImageSize = 0;
        min_t2 = 0;
        max_t3 = 0;
      }


      if (isDerivaRequest) {
        // we expect this request to be 303, but it was 200 report it
        if (e.response && e.response.status === 200) {
          runNumUnsigned += 1;
        }

        runNumDerivaRequests += 1;
        curr_t1 = new Date(e.startedDateTime).getTime() + e.time;
        if (curr_t1 > max_t1) max_t1 = curr_t1;

      }
      else if (isActualImageRequest) {

        if (min_t2 === 0) {
          min_t2 = new Date(e.startedDateTime).getTime();
        }

        runNumFiles += 1;
        runTotalImageSize += e.response.bodySize;

        curr_t3 = new Date(e.startedDateTime).getTime() + e.time;
        if (curr_t3 > max_t3) max_t3 = curr_t3;
      }

    });

    // for the last group
    currReport.runs.push({
      min_t0: convertDateToLocal(min_t0),

      num_signed: runNumDerivaRequests,
      signed_url_duration: max_t1 - min_t0,
      signed_url_throughput: (max_t1 - min_t0) / runNumDerivaRequests,

      num_files: runNumFiles,
      avg_file_size: runTotalImageSize / runNumFiles,
      min_io_throughput: (max_t3 - min_t2) / runNumFiles,
      client_throughput: (max_t3 - min_t0) / runNumFiles,

      num_server_cached_images: runNumServerCached,
      num_browser_cached_images: runNumBrowserCached,

      num_unsigned: runNumUnsigned
    });

    // create summary
    let measuermentTotalImageSize = 0, measurementNumFiles = 0, measurementNumUnsigned = 0, measurementNumSigned = 0,
      measurementTotalSignedURLDuration = 0, measurementTotalSignedURLThroughput = 0,
      measurementTotalMinIOThroughput = 0, measuermentTotalClientThroughput = 0,
      measurementTotalBrowserCached = 0, measurementTotalServerCached = 0;
    currReport.runs.forEach((r) => {

      measurementNumSigned += r.num_signed;
      measurementTotalSignedURLDuration += r.signed_url_duration;
      measurementTotalSignedURLThroughput += r.signed_url_throughput;

      measurementNumFiles += r.num_files;
      measuermentTotalImageSize += (r.avg_file_size * r.num_files);
      measurementTotalMinIOThroughput += r.min_io_throughput;
      measuermentTotalClientThroughput += r.client_throughput;

      measurementTotalBrowserCached += r.num_browser_cached_images;
      measurementTotalServerCached += r.num_server_cached_images;
      measurementNumUnsigned += r.num_unsigned;
    });

    currReport.summary = {
      min_t0: currReport.runs[0].min_t0,
      num_runs: currReport.runs.length,

      num_signed: measurementNumSigned,
      signed_url_duration: measurementTotalSignedURLDuration / currReport.runs.length,
      signed_url_throughput: measurementTotalSignedURLThroughput / currReport.runs.length,

      num_files: measurementNumFiles,
      avg_file_size: measuermentTotalImageSize / measurementNumFiles,
      min_io_throughput: measurementTotalMinIOThroughput / currReport.runs.length,
      client_throughput: measuermentTotalClientThroughput / currReport.runs.length,

      num_server_cached_images: measurementTotalBrowserCached,
      num_browser_cached_images: measurementTotalServerCached,
      num_unsigned: measurementNumUnsigned
    };

    return currReport;
  }

  static addToFullReport(currRun: any): any {
    let fullReport = ImageReporterSigned.getFullReport();

    const key = new Date(currRun.summary.min_t0).getHours();

    if (!(key in fullReport)) {
      fullReport[key] = {
        summary: {
          num_measurements: 1,

          num_signed: currRun.summary.num_signed,
          signed_url_duration: currRun.summary.signed_url_duration,
          signed_url_throughput: currRun.summary.signed_url_throughput,

          num_files: currRun.summary.num_files,
          avg_file_size: currRun.summary.avg_file_size,
          min_io_throughput: currRun.summary.min_io_throughput,
          client_throughput: currRun.summary.client_throughput,

          num_server_cached_images: currRun.summary.num_server_cached_images,
          num_browser_cached_images: currRun.summary.num_browser_cached_images,
          num_unsigned: currRun.summary.num_unsigned
        },
        measurements: [
          currRun
        ]
      };
    } else {
      const prevReportForKey = fullReport[key];

      const totalNumSigned = prevReportForKey.summary.num_signed + currRun.summary.num_signed;
      const totalNumFiles = prevReportForKey.summary.num_files + currRun.summary.num_files;
      const totalNumUnsigned = prevReportForKey.summary.num_unsigned + currRun.summary.num_unsigned;
      let totalFileSize = 0, totalSignedURLDuration = 0, totalSignedURLThroughput = 0, totalNumRuns = 0;
      let totalMinIOTHroughput = 0, totalClientThroughput = 0;

      prevReportForKey.measurements.push(currRun);
      prevReportForKey.measurements.forEach((m) => {
        totalFileSize += (m.summary.avg_file_size * m.summary.num_files);
        totalSignedURLDuration += m.summary.signed_url_duration;
        totalSignedURLThroughput += m.summary.signed_url_throughput;
        totalMinIOTHroughput += m.summary.min_io_throughput;
        totalClientThroughput += m.summary.client_throughput;
        totalNumRuns += m.summary.num_runs;
      })

      const newSummary = {
        num_measurements: prevReportForKey.summary.num_measurements + 1,

        num_signed: totalNumSigned,
        signed_url_duration: totalSignedURLDuration / totalNumRuns,
        signed_url_throughput: totalSignedURLThroughput / totalNumRuns,

        num_files: totalNumFiles,
        avg_file_size: totalFileSize / totalNumFiles,
        min_io_throughput: totalMinIOTHroughput / totalNumRuns,
        client_throughput: totalClientThroughput / totalNumRuns,

        num_server_cached_images: prevReportForKey.summary.num_server_cached_images + currRun.summary.num_server_cached_images,
        num_browser_cached_images: prevReportForKey.summary.num_server_cached_images + currRun.summary.num_browser_cached_images,
        num_unsigned: totalNumUnsigned
      };
      prevReportForKey.summary = newSummary;

    }

    ImageReporterSigned.saveFullReport(fullReport);
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
        signed_url_throughput: r.signed_url_throughput,
        min_io_throughput: r.min_io_throughput,
        client_throughput: r.client_throughput,
        num_server_cached_images: r.num_server_cached_images,
        num_browser_cached_images: r.num_browser_cached_images,
        num_unsigned: r.num_unsigned
      };
    });

    try {
      const { data: res } = await axios.post(REPORT_TABLES.SIGNED, data, { headers: { Cookie: process.env.LOAD_TEST_AUTH_COOKIE } });
      console.log('saved the report in the database.');
    } catch (err) {
      console.log('unable to save the report in the database.');
      console.log(err);
    }
  }
}
