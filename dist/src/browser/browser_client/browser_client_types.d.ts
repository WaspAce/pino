/// <reference types="browser_client" />
/// <reference types="rect" />
/// <reference types="screen_info" />
/// <reference types="browser" />
import { PinoRenderHandlerOptions } from './render_handler/render_handler_types';
export interface PinoBrowserClientOptions {
    render_handler?: PinoRenderHandlerOptions;
}
export interface IPinoBrowserClient {
    native: BrowserClient;
    options: PinoBrowserClientOptions;
    get_view_rect(): Rect;
    get_screen_info(): ScreenInfo;
    browser_created(browser: Browser): any;
    page_loaded(): any;
}
