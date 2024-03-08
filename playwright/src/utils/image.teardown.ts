import { type FullConfig } from '@playwright/test';
import path from 'path';
import { readFileSync, unlinkSync } from 'fs';

export default async function globalSetup(config: FullConfig) {

  try {
    const filePath = path.join(__dirname, '..', '..', 'image-test.har');
    const data = readFileSync(filePath);
    const harContent: any = JSON.parse(data.toString());

    const browserCached: any[] = [];
    const serverCached: any[] = [];
    harContent.log.entries.forEach((e: any) => {
      if (e.response && e.response.status === 304) {
        browserCached.push(e.startedDateTime);
      }

      if (e.response && e.response.bodySize === 0) {
        serverCached.push(e.startedDateTime);
      }
    })

    console.log('browser cached:');
    console.log(browserCached);
    console.log('server cached:');
    console.log(serverCached);


    // TODO find the time 


    unlinkSync(filePath);

  } catch (exp) {
    console.log('something went wrong')
    console.log(exp);
  }
}
