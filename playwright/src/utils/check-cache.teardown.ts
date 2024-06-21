import { type FullConfig } from '@playwright/test';
import path from 'path';
import { readFileSync } from 'fs';

export default async function globalSetup(config: FullConfig) {
  try {
    console.log('prcessing the har file');
    const harFilePath = path.join(__dirname, '..', '..', 'case2-test.har');
    const data = readFileSync(harFilePath);
    const harContent: any = JSON.parse(data.toString());

    const serverCached : any = [], browserCached : any = [];
    harContent.log.entries.forEach((e: any) => {
      if (!e.request || !e.request.url || !e.response) return;

      if (e.response.status === 304) {
        browserCached.push(e.request.url);
        return;
      }

      if (e.response.bodySize === 0) {
        serverCached.push(e.request.url);
        return;
      }
    });

    console.log(`count server cached: ${serverCached.length}, browser cached: ${browserCached.length}`);
    if (serverCached.length > 0) {
      console.log('server cached:');
      console.log(serverCached);
    }
    if (browserCached.length > 0) {
      console.log('browser cached:');
      console.log(browserCached);
    }
  } catch (exp) {
    console.log('something wrong while processing HAR file.');
    console.error(exp);
  }

}
