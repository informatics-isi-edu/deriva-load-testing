import { min, max, mean, median, quantile } from 'simple-statistics'
import fs from 'fs';

export default class TestReporter {
  private static TEMP_FILE_LOCATION = '.temp-report';
  private static REPORT_FILE_LOCATION = 'test-report.txt';

  static addToReport = (obj: any) => {
    const report = TestReporter._getReportObject();

    report['navbar'].push(obj['navbar']);
    report['main_data'].push(obj['main_data']);
    report['all_images'].push(obj['all_images']);

    fs.writeFileSync('.temp-report', JSON.stringify(report));
  }

  static _getReportObject = () => {
    try {
      const rep = fs.readFileSync(TestReporter.TEMP_FILE_LOCATION, 'utf8');
      return JSON.parse(rep);
    } catch (exp) {
      return {
        'navbar': [],
        'main_data': [],
        'all_images': []
      };
    }
  }

  static _createStepReport = (name, inp) => {
    const arr = inp.map((val) => parseFloat(val));
    return [
      `${name}:`,
      `min: ................................. ${min(arr).toFixed(3)}`,
      `max: ................................. ${max(arr).toFixed(3)}`,
      `mean: ................................ ${mean(arr).toFixed(3)}`,
      `median: .............................. ${median(arr).toFixed(3)}`,
      `p95: ................................. ${quantile(arr, .95).toFixed(3)}`,
      `p99: ................................. ${quantile(arr, .99).toFixed(3)}`,
    ].join('\n')
  }

  static removeFullReportFile = () => {
    try {
      fs.unlinkSync(TestReporter.TEMP_FILE_LOCATION);
    } catch (exp) { }
    try {
      fs.unlinkSync(TestReporter.REPORT_FILE_LOCATION);
    } catch (exp) { }
  }

  static createFullReportFile = () => {
    const val = TestReporter._getReportObject();

    fs.unlinkSync(TestReporter.TEMP_FILE_LOCATION);

    const content = [
      TestReporter._createStepReport('navbar', val['navbar']),
      TestReporter._createStepReport('main_data', val['main_data']),
      TestReporter._createStepReport('all_images', val['all_images']),
    ].join('\n\n')

    console.log(content);

    fs.writeFileSync(TestReporter.REPORT_FILE_LOCATION, content);

  }

}
