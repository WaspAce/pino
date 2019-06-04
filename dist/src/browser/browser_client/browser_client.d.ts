/// <reference types="browser_client" />
/// <reference types="browser" />
/// <reference types="screen_info" />
/// <reference types="rect" />
/// <reference types="gui_panel" />
import { IPinoBrowserClient, PinoBrowserClientOptions } from './browser_client_types';
import { IPinoBrowser } from './../browser_types';
export declare class PinoBrowserClient implements IPinoBrowserClient {
    private readonly browser;
    options: PinoBrowserClientOptions;
    native: BrowserClient;
    private render_handler;
    private life_span_handler;
    private load_handler;
    private init_options;
    private create_render_handler;
    private create_life_span_handler;
    private create_load_handler;
    private create_client;
    constructor(browser: IPinoBrowser);
    browser_created(browser: Browser): void;
    page_loaded(): void;
    get_screen_info(): ScreenInfo;
    get_view_rect(): Rect;
    add_draw_target(target: GuiPanel): void;
    was_resized(view_rect: Rect): void;
}
