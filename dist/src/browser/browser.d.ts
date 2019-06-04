/// <reference types="browser" />
/// <reference types="screen_info" />
/// <reference types="rect" />
/// <reference types="gui_panel" />
/// <reference types="mouse_event" />
/// <reference types="mouse_button_type" />
/// <reference types="key_event" />
import { IPino } from './../pino_types';
import { IPinoBrowser, PinoBrowserOptions } from './browser_types';
export declare class PinoBrowser implements IPinoBrowser {
    private readonly pino;
    private readonly create_browser?;
    options: PinoBrowserOptions;
    native: Browser;
    private client;
    private host;
    private on_loaded;
    private init_options;
    private init_client;
    private init_browser;
    constructor(pino: IPino, create_browser?: boolean);
    browser_created(browser: Browser): void;
    page_loaded(): void;
    get_screen_info(): ScreenInfo;
    get_view_rect(): Rect;
    add_draw_target(target: GuiPanel): void;
    was_resized(view_rect: Rect): void;
    send_mouse_wheel_event(event: MouseEvent, delta: number): void;
    send_mouse_down_event(event: MouseEvent, button: MouseButtonType): void;
    send_mouse_up_event(event: MouseEvent, button: MouseButtonType): void;
    send_mouse_move_event(event: MouseEvent): void;
    send_key_press(event: KeyEvent): void;
    send_key_down(event: KeyEvent): void;
    send_key_up(event: KeyEvent): void;
    load(url: string): Promise<{}>;
}
