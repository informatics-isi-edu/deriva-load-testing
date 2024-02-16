import { type FullConfig } from '@playwright/test';
import TestReporter from "./reporter";

export default async function globalSetup(config: FullConfig) {
  TestReporter.removeFullReportFile();
}
