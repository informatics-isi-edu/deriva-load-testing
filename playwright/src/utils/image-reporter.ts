import { min, max, mean, median, quantile } from 'simple-statistics'
import fs from 'fs';

export class ImageTestReport {
  iso_time: string;
  utc_hour: string;
  public page_load: string[] = [];
  all_images_load: string[] = [];

  image_load_time: number[] = [];
  image_size: number[] = [];

  has_server_cache: boolean = false;
  has_browesr_cache: boolean = false;

  constructor() {
    const date = new Date();
    this.utc_hour = date.getUTCHours().toString();
    this.iso_time = date.toISOString();
  }

  toJSON() {
    return {
      iso_time: this.iso_time,
      utc_hour: this.utc_hour,
      page_load: this.page_load,
      all_images_load: this.all_images_load,
      image_load_time: this.image_load_time,
      image_size: this.image_size
    }
  }
}

export class ImageTestReportService {
  private static CURR_REPORT_FILE_LOCATION = '.temp-report';
  private static FULL_REPORT_FILE_LOCATION = 'test-report.json';

  static saveCurrentReport(obj: ImageTestReport) {
    fs.writeFileSync('.temp-report', JSON.stringify(obj.toJSON()));
  }

  static getCurrentReport() : ImageTestReport | undefined {
    try {
      const rep = fs.readFileSync(ImageTestReportService.CURR_REPORT_FILE_LOCATION, 'utf8');
      return JSON.parse(rep);
    } catch (exp) {
      console.log('there is no current report');
      return undefined;
    }
  }

  static removeCurrentReport() {
    try {
      fs.unlinkSync(ImageTestReportService.CURR_REPORT_FILE_LOCATION);
    } catch (exp) { }
  }

  static addToFullReport(obj: ImageTestReport) {
    let fullRep : ImageTestReport[];
    try {
      const f = fs.readFileSync(ImageTestReportService.FULL_REPORT_FILE_LOCATION, 'utf8');
      fullRep = JSON.parse(f);
    } catch (exp) {
      fullRep = [];
    }

    fullRep.push(obj);

    const content = JSON.stringify(fullRep, undefined, 2);
    fs.writeFileSync(ImageTestReportService.FULL_REPORT_FILE_LOCATION, content);
  }

  static createSummary() {
    let fullRep : any[];
    try {
      const f = fs.readFileSync(ImageTestReportService.FULL_REPORT_FILE_LOCATION, 'utf8');
      fullRep = JSON.parse(f);
    } catch (exp) {
      console.log('report file is either missing or invalid.');
      return;
    }

    // fullRep.forEach(())
  }

  private static _createStepReport = (name, inp) => {
    const arr = inp.map((val) => parseFloat(val));
    return [
      `${name}:`,
      `count: ............................... ${arr.length}`,
      `min: ................................. ${min(arr).toFixed(3)}`,
      `max: ................................. ${max(arr).toFixed(3)}`,
      `mean: ................................ ${mean(arr).toFixed(3)}`,
      `median: .............................. ${median(arr).toFixed(3)}`,
      `p95: ................................. ${quantile(arr, .95).toFixed(3)}`,
      `p99: ................................. ${quantile(arr, .99).toFixed(3)}`,
    ].join('\n')
  }
}
