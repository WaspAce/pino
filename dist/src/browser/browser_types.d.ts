/// <reference types="screen_info" />
/// <reference types="rect" />
/// <reference types="gui_panel" />
/// <reference types="browser" />
import { PinoBrowserClientOptions } from './browser_client/browser_client_types';
export interface IPinoBrowser {
    options: PinoBrowserOptions;
    get_screen_info(): ScreenInfo;
    get_view_rect(): Rect;
    add_draw_target(target: GuiPanel): any;
    browser_created(browser: Browser): any;
    page_loaded(): any;
}
export interface PinoBrowserOptions {
    frame_rate?: number;
    client?: PinoBrowserClientOptions;
}
