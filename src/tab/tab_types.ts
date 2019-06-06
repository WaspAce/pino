import { PinoBrowserOptions } from './browser/browser_types';

export interface IPinoTab {
  options: PinoTabOptions;

  view_resized(
    view_rect: Rect
  );

  get_view_rect(): Rect;

  get_screen_info(): ScreenInfo;

  browser_created();
}

export interface PinoTabOptions {
  browser?: PinoBrowserOptions;
  load_timeout_ms?: number;
}
