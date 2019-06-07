import { IPinoBrowser } from './../browser_types';
import { PinoRenderHandlerOptions } from './render_handler/render_handler_types';

export interface PinoBrowserClientOptions {
  render_handler?: PinoRenderHandlerOptions;
}

export type UrlFilter = (
  url: string
) => boolean;

export interface IPinoBrowserClient {
  readonly browser: IPinoBrowser;
  native: BrowserClient;
  options: PinoBrowserClientOptions;

  get_view_rect(): Rect;

  get_screen_info(): ScreenInfo;

  browser_created(
    browser: Browser
  );

  page_loaded();

  frames_loaded();
}
