/// <reference types="screen_info" />
/// <reference types="rect" />
/// <reference types="mouse_event" />
/// <reference types="mouse_button_type" />
/// <reference types="key_event" />
import { IPino, PinoOptions } from './pino_types';
export declare class Pino implements IPino {
    screen_info: ScreenInfo;
    options: PinoOptions;
    private browser;
    private gui;
    private on_initialized;
    private get_default_rect;
    private init_options;
    private init_screen_info;
    private create_browser;
    private create_gui;
    private resolve_initialized;
    constructor(user_options: PinoOptions, create_browser?: boolean);
    on_view_resized(view_rect: Rect): void;
    send_mouse_wheel_event(event: MouseEvent, delta: number): void;
    send_mouse_down_event(event: MouseEvent, button: MouseButtonType): void;
    send_mouse_up_event(event: MouseEvent, button: MouseButtonType): void;
    send_mouse_move_event(event: MouseEvent): void;
    send_key_press(event: KeyEvent): void;
    send_key_down(event: KeyEvent): void;
    send_key_up(event: KeyEvent): void;
    get_screen_info(): ScreenInfo;
    get_view_rect(): Rect;
    browser_created(): void;
    wait_initialized(): Promise<{}>;
    load(url: string): Promise<void>;
}
