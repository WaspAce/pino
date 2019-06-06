import { PinoGui } from './gui/gui';
import { PinoTabOptions } from './tab/tab_types';
import { PinoTab } from './tab/tab';

export interface IPino {
  screen_info: ScreenInfo;
  options: PinoOptions;
  gui?: PinoGui;

  get_view_rect(): Rect;

  view_resized(
    view_rect: Rect
  );

  active_tab_index_changed(
    gui_active_tab_index: number
  );

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

  add_tab(): Promise<PinoTab>;
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
  view_rect?: Rect;
  screen?: ScreenOptions;
  tab?: PinoTabOptions;
  app_loop_interval_ms?: number;
  gui_loop_interval_ms?: number;
  initial_scripts?: string[];
  user_agent?: string;
}
