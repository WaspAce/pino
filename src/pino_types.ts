import { PinoTabOptions } from './tab/tab_types';

export interface ScreenOptions {
  rect?: Rect;
  available_rect?: Rect;
  color_depth?: number;
  device_scale_factor?: number;
  is_monochrome?: boolean;
}

export interface PinoOptions {
  gui?: boolean;
  view_rect?: Rect;
  screen?: ScreenOptions;
  tab?: PinoTabOptions;
  app_loop_interval_ms?: number;
  gui_loop_interval_ms?: number;
  initial_scripts?: string[];
  user_agent?: string;
  load_timeout_ms?: number;
}
