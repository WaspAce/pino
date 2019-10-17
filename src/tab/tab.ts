import { PinoBrowser } from './browser/browser';
import { PinoTabOptions } from './tab_types';
import { Pino } from '../pino';

export class PinoTab {

  screen_info: ScreenInfo;
  options: PinoTabOptions;
  gui_tab_index = -1;
  browser: PinoBrowser;

  private on_initialized: (value?: any) => void;

  private init_options() {
    const user_options = this.pino.options.tab;
    const default_options: PinoTabOptions = {
      load_timeout_ms: 30000
    };
    if (!user_options) {
      this.options = default_options;
    } else {
      this.options = Object.assign(default_options, user_options);
    }
    this.options.browser.load_timeout_ms = this.options.load_timeout_ms;
  }

  private create_browser(
    create_browser: boolean
  ) {
    this.browser = new PinoBrowser(this, create_browser);
  }

  private resolve_initialized() {
    if (this.on_initialized) {
      const resolve = this.on_initialized;
      this.on_initialized = undefined;
      resolve();
    }
  }

  constructor(
    readonly pino: Pino,
    create_browser?: boolean
  ) {
    this.init_options();
    this.create_browser(create_browser);
  }

  view_resized(
    view_rect: Rect
  ): void {
    if (this.browser) {
      this.browser.was_resized(view_rect);
    }
  }

  send_mouse_wheel_event(
    event: MouseEvent,
    delta: number
  ) {
    if (this.browser) {
      this.browser.send_mouse_wheel_event(event, delta);
    }
  }

  send_mouse_down_event(
    event: MouseEvent,
    button: MouseButtonType
  ) {
    if (this.browser) {
      this.browser.send_mouse_down_event(event, button);
    }
  }

  send_mouse_up_event(
    event: MouseEvent,
    button: MouseButtonType
  ) {
    if (this.browser) {
      this.browser.send_mouse_up_event(event, button);
    }
  }

  send_mouse_move_event(
    event: MouseEvent
  ) {
    if (this.browser) {
      this.browser.send_mouse_move_event(event);
    }
  }

  send_key_press(
    event: KeyEvent
  ) {
    if (this.browser) {
      this.browser.send_key_press(event);
    }
  }

  send_key_down(
    event: KeyEvent
  ) {
    if (this.browser) {
      this.browser.send_key_down(event);
    }
  }

  send_key_up(
    event: KeyEvent
  ) {
    if (this.browser) {
      this.browser.send_key_up(event);
    }
  }

  get_screen_info(): ScreenInfo {
    return this.pino.screen_info;
  }

  get_view_rect(): Rect {
    return this.pino.get_view_rect();
  }

  browser_created() {
    if (this.pino.gui) {
      this.browser.add_draw_target(this.pino.gui.view);
    }
    this.resolve_initialized();
  }

  async wait_initialized() {
    await new Promise(resolve => {
      this.on_initialized = resolve;
      if (this.browser.native) {
        this.resolve_initialized();
      }
    });
    await this.browser.wait_loaded();
  }

  async load(
    url: string,
    referrer?: string,
    referrer_policy?: ReferrerPolicy
  ) {
    return this.browser.load(url, referrer, referrer_policy);
  }

  async wait_loaded() {
    return this.browser.wait_loaded();
  }

  was_hidden(
    hidden: boolean
  ) {
    this.browser.was_hidden(hidden);
  }

  async execute_js_and_wait_ipc(
    code: string,
    timout_ms?: number
  ): Promise<ListValue> {
    return this.browser.execute_js_and_wait_ipc(code, timout_ms);
  }

  execute_js(
    code: string
  ) {
    this.browser.execute_js(code);
  }
}
