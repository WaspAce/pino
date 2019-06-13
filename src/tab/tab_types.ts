import { PinoBrowserOptions } from './browser/browser_types';

export interface PinoTabOptions {
  browser?: PinoBrowserOptions;
  load_timeout_ms?: number;
}
