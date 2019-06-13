import { PinoBrowserClientOptions } from './browser_client/browser_client_types';

export interface PinoBrowserOptions {
  frame_rate?: number;
  client?: PinoBrowserClientOptions;
  load_timeout_ms?: number;
}
