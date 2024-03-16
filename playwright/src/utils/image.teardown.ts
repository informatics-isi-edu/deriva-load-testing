import { type FullConfig } from '@playwright/test';
import path from 'path';
import { readFileSync, unlinkSync } from 'fs';
import { ImageTestReportService } from './image-reporter';

export default async function globalSetup(config: FullConfig) {

  try {
    const harFilePath = path.join(__dirname, '..', '..', 'test.har');
    const data = readFileSync(harFilePath);
    const harContent: any = JSON.parse(data.toString());

    let has_browesr_cache = false;
    let has_server_cache = false;

    const image_load: number[][] = [];
    const image_size: number[][] = [];
    const all_images_load: number[] = [];

    let groupNumber = 0, currGroupNumber = 0, startTime = 0, maxTime = 0, currEndTime = 0;
    let currGroupLoad: number[] = [], currGroupSize: number[] = [];
    harContent.log.entries.forEach((e: any) => {
      if (e.response && e.response.status === 304) {
        has_browesr_cache = true;
      }

      if (e.response && e.response.bodySize === 0) {
        has_server_cache = true;
      }

      if (e.request && e.request.method === 'GET') {
        if (e.request.url.startsWith('https://dev.atlas-d2k.org/ermrest/catalog/2/attributegroup/M:=Gene_Expression:Image/Thumbnail_Bytes::gt::1024')) {
          groupNumber++;
        }

        /**
         * group the hatrac urls based on the reload step, and the for each group, report:
         *   - all_images_load: the time that it took for all images to load. which is basically the time between the
         *                      first startedDateTime and the maximum startedDateTime+time.
         *   also array of their individual load and sizes for now
         */
        if (groupNumber > 1 && e.request.url.startsWith('https://dev.atlas-d2k.org/hatrac/resources/gene_expression') && e.time !== -1) {
          // we've now started a new group
          if (groupNumber !== currGroupNumber) {
            if (groupNumber !== 2) {
              // store the old captured times
              all_images_load.push(maxTime - startTime);
              image_load.push(currGroupLoad);
              image_size.push(currGroupSize);
            }

            // reinitialize values for the next group
            currGroupNumber = groupNumber;
            currGroupLoad = [];
            currGroupSize = [];
            startTime = new Date(e.startedDateTime).getTime();
            maxTime = startTime + e.time;
          }

          currGroupLoad.push(e.time);
          currGroupSize.push(e.response.bodySize);
          currEndTime = new Date(e.startedDateTime).getTime() + e.time;
          if (currEndTime > maxTime) maxTime = currEndTime;
        }
      }
    });

    all_images_load.push(maxTime - startTime);
    image_load.push(currGroupLoad);
    image_size.push(currGroupSize);

    // save to full report
    const rep = ImageTestReportService.getCurrentReport();
    if (rep) {
      rep.has_browesr_cache = has_browesr_cache;
      rep.has_server_cache = has_server_cache;

      rep.all_images_load = all_images_load;
      rep.image_load_time = image_load;
      rep.image_size = image_size;

      ImageTestReportService.saveCurrentReport(rep);
      ImageTestReportService.addToFullReport(rep)

      console.log([
        'Finshed successfuly!',
        'For a summary of current and historical report take a lookt at test-report-summary.md',
        'Other artifacts:',
        '- test-report.json',
        '- test.har'
      ].join('\n'));
    }

  } catch (exp) {
    console.log('something went wrong')
    console.log(exp);
  }
}
