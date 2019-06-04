import { PinoBrowserClient } from './browser_client/browser_client';
import { IPino } from './../pino_types';
import { IPinoBrowser, PinoBrowserOptions } from './browser_types';

export class PinoBrowser implements IPinoBrowser {
  options: PinoBrowserOptions;
  native: Browser;

  private client: PinoBrowserClient;
  private host: BrowserHost;
  private on_loaded: (value?: any | PromiseLike<any>) => void;

  private init_options() {
    const user_options = this.pino.options.browser;
    const default_options: PinoBrowserOptions = {
      frame_rate: 30
    };
    if (!user_options) {
      this.options = default_options;
    } else {
      this.options = Object.assign(default_options, user_options);
    }
  }

  private init_client() {
    this.client = new PinoBrowserClient(this);
  }

  private init_browser() {
    if (this.create_browser) {
      const window_info = new WindowInfo();
      const settings = new BrowserSettings();
      settings.frame_rate = this.options.frame_rate;

      const browser = new Browser(
        window_info,
        this.client.native,
        '',
        settings
      );
    }
  }

  constructor(
    private readonly pino: IPino,
    private readonly create_browser?: boolean
  ) {
    this.init_options();
    this.init_client();
    this.init_browser();
  }

  browser_created(
    browser: Browser
  ) {
    this.native = browser;
    this.host = browser.get_host();
    this.pino.browser_created();
  }

  page_loaded() {
    if (this.on_loaded && !this.native.is_loading) {
      const resolve = this.on_loaded;
      this.on_loaded = undefined;
      resolve();
    }
  }

  get_screen_info(): ScreenInfo {
    return this.pino.screen_info;
  }

  get_view_rect(): Rect {
    return this.pino.get_view_rect();
  }

  add_draw_target(
    target: GuiPanel
  ) {
    this.client.add_draw_target(target);
  }

  was_resized(
    view_rect: Rect
  ) {
    if (this.host) {
      this.host.was_resized();
    }
    this.client.was_resized(view_rect);
  }

  send_mouse_wheel_event(
    event: MouseEvent,
    delta: number
  ) {
    if (this.host) {
      this.host.send_mouse_wheel_event(event, 0, delta);
    }
  }

  send_mouse_down_event(
    event: MouseEvent,
    button: MouseButtonType
  ) {
    if (this.host) {
      this.host.send_mouse_click_event(event, button, false, 1);
    }
  }

  send_mouse_up_event(
    event: MouseEvent,
    button: MouseButtonType
  ) {
    if (this.host) {
      this.host.send_mouse_click_event(event, button, true, 1);
    }
  }

  send_mouse_move_event(
    event: MouseEvent
  ) {
    if (this.host) {
      this.host.send_mouse_move_event(event, false);
    }
  }

  send_key_press(
    event: KeyEvent
  ) {
    if (this.host) {
      this.host.send_key_event(event);
    }
  }

  send_key_down(
    event: KeyEvent
  ) {
    if (this.host) {
      this.host.send_key_event(event);
    }
  }

  send_key_up(
    event: KeyEvent
  ) {
    if (this.host) {
      this.host.send_key_event(event);
    }
  }

  async load(
    url: string
  ) {
    this.on_loaded = undefined;
    if (this.native) {
      if (this.native.is_loading) {
        this.native.stop_load();
      }
      return new Promise(resolve => {
        this.on_loaded = resolve;
        this.native.get_main_frame().load_url(url);
      });
    }
  }
}
