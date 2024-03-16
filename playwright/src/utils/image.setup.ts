import { type FullConfig } from '@playwright/test';
import { ImageTestReportService } from './image-reporter';

export default async function globalSetup(config: FullConfig) {
  ImageTestReportService.cleanUpReportsForNewRun();
}
