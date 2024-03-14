import { type FullConfig } from '@playwright/test';
import path from 'path';
import { readFileSync, unlinkSync } from 'fs';
import { ImageTestReportService } from './image-reporter';

export default async function globalSetup(config: FullConfig) {

  try {
    const harFilePath = path.join(__dirname, '..', '..', 'image-test.har');
    const data = readFileSync(harFilePath);
    const harContent: any = JSON.parse(data.toString());

    let has_browesr_cache = false;
    let has_server_cache = false;

    let isReload = false;
    const image_load: any[] = [];
    const image_size: any[] = [];
    harContent.log.entries.forEach((e: any) => {
      if (e.response && e.response.status === 304) {
        has_browesr_cache = true;
      }

      if (e.response && e.response.bodySize === 0) {
        has_server_cache = true;
      }

      if (e.request && e.request.method === 'GET') {
        if (isReload && e.request.url.startsWith('https://dev.atlas-d2k.org/hatrac/resources/gene_expression') && e.time !== -1) {
          image_load.push(e.time);
          image_size.push(e.response.bodySize);
        }

        if (!isReload && e.request.url.startsWith('https://dev.atlas-d2k.org/ermrest/catalog/2/attributegroup/M:=Gene_Expression:Image/Thumbnail_Bytes::gt::1024')) {
          isReload = true;
        }
      }
    })


    // save to full report
    const rep = ImageTestReportService.getCurrentReport();
    if (rep) {
      rep.has_browesr_cache = has_browesr_cache;
      rep.has_server_cache = has_server_cache;

      rep.image_load_time = image_load;
      rep.image_size = image_size;

      ImageTestReportService.addToFullReport(rep);
      ImageTestReportService.removeCurrentReport();
    }

    // unlinkSync(harFilePath);

  } catch (exp) {
    console.log('something went wrong')
    console.log(exp);
  }
}
