import { min, max, mean, median, quantile } from 'simple-statistics'
import fs from 'fs';

export class ImageTestReport {
  iso_time: string;
  utc_hour: string;
  pw_page_load: number[] = [];
  pw_all_images_load: number[] = [];

  all_images_load: number[] = [];
  image_load_time: number[][] = [];
  image_size: number[][] = [];

  has_server_cache: boolean = false;
  has_browesr_cache: boolean = false;

  constructor() {
    const date = new Date();
    this.utc_hour = date.getUTCHours().toString();
    this.iso_time = date.toISOString();
  }

  static fromJSON(obj: any) {
    let res = new ImageTestReport();
    [
      'iso_time', 'utc_hour', 'pw_page_load', 'pw_all_images_load',
      'all_images_load', 'image_load_time', 'image_size',
      'has_server_cache', 'has_browesr_cache',
    ].forEach((prop) => {
      res[prop] = obj[prop];
    });

    return res;
  }

  toJSON() {
    return {
      iso_time: this.iso_time,
      utc_hour: this.utc_hour,
      pw_page_load: this.pw_page_load,
      pw_all_images_load: this.pw_all_images_load,
      all_images_load: this.all_images_load,
      image_load_time: this.image_load_time,
      image_size: this.image_size
    }
  }

  getSummary() : string {
    return [
      '### HAR report',

      '#### Time to load all images (ms)',
      ImageTestReport.createListSummary(this.all_images_load),

      // image_load_time and image_size are not flat arrays, what should we do with them?

      '### Cache',
      `- reported server cache: ${this.has_server_cache}`,
      `- reported browser cache: ${this.has_browesr_cache}`,

      '### Playwright report',

      '#### Initial page load time (ms)',
      ImageTestReport.createListSummary(this.pw_page_load),

      '#### Time to load all images (ms)',
      ImageTestReport.createListSummary(this.pw_all_images_load),

    ].join('\n\n');
  }

  static createListSummary (inp: any[]) {
    const arr = inp.map((val) => parseFloat(val));
    if (arr.length === 0) {
      return 'something went wrong because the reported array is empty.';
    }
    return [
      `- count: ${arr.length}`,
      `- min: ${min(arr).toFixed(3)}`,
      `- max: ${max(arr).toFixed(3)}`,
      `- mean: ${mean(arr).toFixed(3)}`,
      `- median: ${median(arr).toFixed(3)}`,
      `- p95: ${quantile(arr, .95).toFixed(3)}`,
      `- p99: ${quantile(arr, .99).toFixed(3)}`,
    ].join('\n');
  }
}

export class ImageTestReportService {
  private static CURR_REPORT_FILE_LOCATION = '.temp-report.json';
  private static FULL_REPORT_FILE_LOCATION = 'test-report.json';
  private static FULL_REPORT_SUMMARY_LOCATION = 'test-report-summary.md';

  static saveCurrentReport(obj: ImageTestReport) : string {
    fs.writeFileSync(ImageTestReportService.CURR_REPORT_FILE_LOCATION, JSON.stringify(obj.toJSON()));

    return obj.getSummary();
  }

  static getCurrentReport() : ImageTestReport | undefined {
    try {
      const rep = fs.readFileSync(ImageTestReportService.CURR_REPORT_FILE_LOCATION, 'utf8');
      return ImageTestReport.fromJSON(JSON.parse(rep));
    } catch (exp) {
      console.log('there is no current report');
      return undefined;
    }
  }

  static cleanUpReportsForNewRun() {
    try {
      fs.unlinkSync(ImageTestReportService.CURR_REPORT_FILE_LOCATION);
    } catch (exp) { }

    try {
      fs.unlinkSync(ImageTestReportService.FULL_REPORT_SUMMARY_LOCATION);
    } catch (exp) { }
  }

  static addToFullReport(obj: ImageTestReport) : string {
    const fullReport = new ImageTestReport();
    let reports;
    try {
      const f = fs.readFileSync(ImageTestReportService.FULL_REPORT_FILE_LOCATION, 'utf8');
      reports = JSON.parse(f);
    } catch (exp) {
      reports = [];
    }
    reports.push(obj);

    // save it to file
    const content = JSON.stringify(reports);
    fs.writeFileSync(ImageTestReportService.FULL_REPORT_FILE_LOCATION, content);

    // create the summary
    reports.forEach((r) => {
      fullReport.all_images_load.push(...r.all_images_load);
      fullReport.pw_all_images_load.push(...r.pw_all_images_load);
      fullReport.pw_page_load.push(...r.pw_page_load);

      // what about the individual image reports
      if (r.has_browesr_cache) {
        fullReport.has_browesr_cache = true;
      }
      if (r.has_server_cache) {
        fullReport.has_server_cache = true;
      }
    });
    const summaryContent = [
      '## Current report',
      obj.getSummary(),
      '## Full report',
      fullReport.getSummary()
    ].join('\n')

    fs.writeFileSync(ImageTestReportService.FULL_REPORT_SUMMARY_LOCATION, summaryContent);
    return summaryContent;
  }

}
