import { IPinoTab } from './../tab_types';
import { PinoBrowserClient } from './browser_client/browser_client';
import { IPinoBrowser, PinoBrowserOptions } from './browser_types';

export class PinoBrowser implements IPinoBrowser {
  options: PinoBrowserOptions;
  native: Browser;

  private client: PinoBrowserClient;
  private host: BrowserHost;
  private on_frames_loaded: (value?: any | PromiseLike<any>) => void;
  private on_page_loaded: (value?: any | PromiseLike<any>) => void;
  private on_ipc_message_resolve: (value?: ListValue | PromiseLike<ListValue>) => void;
  private on_ipc_message_reject: (reason?: any) => void;
  private load_timeout = -1;

  private init_options() {
    const user_options = this.tab.options.browser;
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

  private start_load_timer() {
    if (this.load_timeout > -1) {
      clearTimeout(this.load_timeout);
      this.load_timeout = -1;
    }
    this.load_timeout = setTimeout(() => {
      this.load_timeout = -1;
      this.page_loaded();
      this.frames_loaded();
    },
    this.options.load_timeout_ms);
  }

  private wrap_js_code(
    code: string
  ): string {
    return `
      try {
        ${code}
      } catch(e) {
        js_exception(e);
      }
    `;
  }

  constructor(
    readonly tab: IPinoTab,
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
    this.tab.browser_created();
  }

  frames_loaded() {
    if (this.on_frames_loaded) {
      const resolve = this.on_frames_loaded;
      this.on_frames_loaded = undefined;
      resolve();
    }
  }

  page_loaded() {
    if (this.on_page_loaded) {
      const resolve = this.on_page_loaded;
      this.on_page_loaded = undefined;
      resolve();
    }
  }

  get_screen_info(): ScreenInfo {
    return this.tab.get_screen_info();
  }

  get_view_rect(): Rect {
    return this.tab.get_view_rect();
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

  process_message_received(
    message: ProcessMessage
  ) {
    if (message.name === 'transfer_data' && this.on_ipc_message_resolve) {
      this.on_ipc_message_reject = undefined;
      const resolve = this.on_ipc_message_resolve;
      this.on_ipc_message_resolve = undefined;
      resolve(message.get_argument_list());
    } else if (message.name === 'js_exception' && this.on_ipc_message_reject) {
      this.on_ipc_message_resolve = undefined;
      const reject = this.on_ipc_message_reject;
      this.on_ipc_message_reject = undefined;
      const error = message.get_argument_list().get_string(0);
      reject(`IPC exception: ${error}`);
    }
  }

  async wait_frames_loaded() {
    return new Promise(resolve => {
      this.on_frames_loaded = resolve;
    });
  }

  async wait_page_loaded() {
    return new Promise(resolve => {
      this.on_page_loaded = resolve;
    });
  }

  async load(
    url: string
  ) {
    if (this.native) {
      if (this.native.is_loading) {
        this.native.stop_load();
      }
      this.native.get_main_frame().load_url(url);
      await this.wait_loaded();
      this.native.stop_load();
    }
  }

  async wait_loaded() {
    const promises = [
      this.wait_frames_loaded(),
      this.wait_page_loaded()
    ];
    this.start_load_timer();
    return Promise.all(promises);
  }

  was_hidden(
    hidden: boolean
  ) {
    if (this.host) {
      this.host.was_hidden(hidden);
    }
  }

  async execute_js_and_wait_ipc(
    code: string
  ): Promise<ListValue> {
    return new Promise<ListValue>((resolve, reject) => {
      if (this.native) {
        this.on_ipc_message_resolve = resolve;
        this.on_ipc_message_reject = reject;
        this.native.get_main_frame().execute_java_script(
          this.wrap_js_code(code),
          'http://custom_js.wa',
          0
        );
      } else {
        reject('No native browser');
      }
    });
  }
}
