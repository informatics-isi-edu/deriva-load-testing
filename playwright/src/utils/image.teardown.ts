import { type FullConfig } from '@playwright/test';
import path from 'path';
import { readFileSync, unlinkSync } from 'fs';
import { ImageTestReportService } from './image-reporter';

export default async function globalSetup(config: FullConfig) {
  try {
    console.log('prcessing the har file');
    const harFilePath = path.join(__dirname, '..', '..', 'test.har');
    const data = readFileSync(harFilePath);
    const harContent: any = JSON.parse(data.toString());

    const isSigned = process.env.LOAD_TEST_SIGNED == 'true';

    const currReport = ImageTestReportService.processHARFile(harContent, isSigned);

    console.log('current measurement:')
    console.log(JSON.stringify(currReport, undefined, 2));

    ImageTestReportService.addToFullReport(currReport, isSigned);
    console.log('current measurement added to the full report');

  } catch (exp) {
    console.log('something went wrong')
    console.log(exp);
  }
}
