/// <reference types="rect" />
/// <reference types="screen_info" />
/// <reference types="mouse_event" />
/// <reference types="mouse_button_type" />
/// <reference types="key_event" />
import { PinoBrowserOptions } from './browser/browser_types';
export declare type OnViewResized = (view_rect: Rect) => void;
export interface IPino {
    screen_info: ScreenInfo;
    options: PinoOptions;
    on_view_resized: OnViewResized;
    get_view_rect(): Rect;
    get_screen_info(): ScreenInfo;
    send_mouse_wheel_event(event: MouseEvent, delta: number): any;
    send_mouse_down_event(event: MouseEvent, button: MouseButtonType): any;
    send_mouse_up_event(event: MouseEvent, button: MouseButtonType): any;
    send_mouse_move_event(event: MouseEvent): any;
    send_key_press(event: KeyEvent): any;
    send_key_down(event: KeyEvent): any;
    send_key_up(event: KeyEvent): any;
    browser_created(): any;
}
export interface ScreenOptions {
    rect?: Rect;
    available_rect?: Rect;
    color_depth?: number;
    device_scale_factor?: number;
    is_monochrome?: boolean;
}
export interface PinoOptions {
    gui?: boolean;
    screen?: ScreenOptions;
    browser?: PinoBrowserOptions;
}
