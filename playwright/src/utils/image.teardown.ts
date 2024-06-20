import { type FullConfig } from '@playwright/test';
import path from 'path';
import { readFileSync } from 'fs';
import { ImageReporter } from './image-reporter';
import { ImageReporterSigned } from './image-reporter-signed';

export default async function globalSetup(config: FullConfig) {
  try {
    console.log('prcessing the har file');
    const harFilePath = path.join(__dirname, '..', '..', 'image-test.har');
    const data = readFileSync(harFilePath);
    const harContent: any = JSON.parse(data.toString());

    const isSigned = process.env.LOAD_TEST_SIGNED == 'true';

    const currReport = isSigned ? ImageReporterSigned.processHARFile(harContent) : ImageReporter.processHARFile(harContent);

    console.log(`current measurement (${isSigned ? 'signed': 'unsigned'}):`)
    console.log(JSON.stringify(currReport, undefined, 2));

    // uncomment this if you also want the reports in a json file.
    // const reportFileLocation = isSigned ? ImageReporterSigned.REPORT_LOCATION : ImageReporter.REPORT_LOCATION;
    // if (isSigned) {
    //   ImageReporterSigned.addToFullReport(currReport);
    // } else {
    //   ImageReporter.addToFullReport(currReport);
    // }
    // console.log(`current measurement added to the full report: ${reportFileLocation}`);

    if (isSigned) {
      await ImageReporterSigned.saveInDB(currReport);
    } else {
      await ImageReporter.saveInDB(currReport);
    }

  } catch (exp) {
    console.log('something went wrong')
    console.log(exp);
  }
}
