import { PinoBrowser } from './browser/browser';
import { Pino } from '../pino';

export class PinoTab {

  screen_info: ScreenInfo;
  gui_tab_index = -1;
  browser: PinoBrowser;

  private on_initialized: (value?: any) => void;

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
    this.create_browser(create_browser);
  }

  view_resized(): void {
    if (this.browser) {
      this.browser.was_resized();
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

  send_touch_event(
    event: TouchEvent
  ) {
    if (this.browser) {
      this.browser.send_touch_event(event);
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
