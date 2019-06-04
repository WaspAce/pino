import { PinoBrowserOptions } from './browser/browser_types';

export type OnViewResized = (
  view_rect: Rect
) => void;

export interface IPino {
  screen_info: ScreenInfo;
  options: PinoOptions;

  on_view_resized: OnViewResized;

  get_view_rect(): Rect;
  get_screen_info(): ScreenInfo;

  send_mouse_wheel_event(
    event: MouseEvent,
    delta: number
  );

  send_mouse_down_event(
    event: MouseEvent,
    button: MouseButtonType
  );

  send_mouse_up_event(
    event: MouseEvent,
    button: MouseButtonType
  );

  send_mouse_move_event(
    event: MouseEvent
  );

  send_key_press(
    event: KeyEvent
  );

  send_key_down(
    event: KeyEvent
  );

  send_key_up(
    event: KeyEvent
  );

  browser_created();
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
