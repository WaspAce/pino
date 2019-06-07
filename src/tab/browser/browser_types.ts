import { IPinoTab } from './../tab_types';
import { PinoBrowserClientOptions } from './browser_client/browser_client_types';

export interface IPinoBrowser {
  readonly tab: IPinoTab;

  options: PinoBrowserOptions;

  get_screen_info(): ScreenInfo;

  get_view_rect(): Rect;

  add_draw_target(
    target: GuiPanel
  );

  browser_created(
    browser: Browser
  );

  page_loaded();

  subprocess_loaded();

  process_message_received(
    message: ProcessMessage
  );
}

export interface PinoBrowserOptions {
  frame_rate?: number;
  client?: PinoBrowserClientOptions;
  load_timeout_ms?: number;
}
