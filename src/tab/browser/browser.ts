import { Pino } from './../../pino';
import { PinoBrowserClient } from './browser_client/browser_client';
import { PinoTab } from '../tab';
import { URI } from '../../uri/uri';
import { IPC_TRANSFER_DATA_FUN_NAME, IPC_EXCEPTION_FUN_NAME, URL_DEFAULT_SCRIPT, URL_BLANK_PAGE } from '../../pino_consts';

export class PinoBrowser {
  native: Browser;
  client: PinoBrowserClient;

  private host: BrowserHost;
  private on_subprocess_loaded: (value?: any) => void;
  private on_page_loaded: (value?: any) => void;
  private on_ipc_message_resolve: (value?: ListValue) => void;
  private on_ipc_message_reject: (reason?: any) => void;
  private load_timeout = -1;
  private on_painted: (images: Image[]) => void;

  private init_client() {
    this.client = new PinoBrowserClient(this);
  }

  private init_browser() {
    if (this.create_browser) {
      const window_info = new WindowInfo();
      const settings = new BrowserSettings();
      settings.frame_rate = this.pino.frame_rate;

      const browser = new Browser(
        window_info,
        this.client.native,
        URL_BLANK_PAGE,
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
      this.subprocess_loaded();
    },
    this.pino.load_timeout_ms);
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

  private new_load_request(
    resolve: (value?: unknown) => void,
    reject: (reason?: any) => void,
    url: string,
    referrer?: string,
    referrer_policy?: ReferrerPolicy,
  ): Request | undefined {
    const result = new Request();
    result.url = url;
    if (result.url === '') {
      result.url = new URI(url).stringify();
    }
    if (result.url === '') {
      reject(`'url' parameter must be fully qualified URL`);
      return undefined;
    }
    if (referrer) {
      if (!referrer_policy) {
        referrer_policy = ReferrerPolicy.REFERRER_POLICY_CLEAR_REFERRER_ON_TRANSITION_FROM_SECURE_TO_INSECURE;
      }
      result.set_referrer(referrer, referrer_policy);
      if (result.referrer_url === '') {
        result.set_referrer(new URI(referrer).stringify(), referrer_policy);
      }
      if (result.referrer_url === '') {
        reject(`'referrer' parameter must be fully qualified URL`);
        return undefined;
      }
    }
    return result;
  }

  private reject_ipc_message(
    reason?
  ) {
    if (this.on_ipc_message_reject) {
      this.on_ipc_message_resolve = undefined;
      const reject = this.on_ipc_message_reject;
      this.on_ipc_message_reject = undefined;
      reject(reason);
    }
  }

  constructor(
    readonly tab: PinoTab,
    private readonly create_browser?: boolean
  ) {
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

  subprocess_loaded() {
    if (this.on_subprocess_loaded) {
      const resolve = this.on_subprocess_loaded;
      this.on_subprocess_loaded = undefined;
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
    if (message.name === IPC_TRANSFER_DATA_FUN_NAME && this.on_ipc_message_resolve) {
      this.on_ipc_message_reject = undefined;
      const resolve = this.on_ipc_message_resolve;
      this.on_ipc_message_resolve = undefined;
      resolve(message.get_argument_list());
    } else if (message.name === IPC_EXCEPTION_FUN_NAME && this.on_ipc_message_reject) {
      const error = message.get_argument_list().get_string(0);
      this.reject_ipc_message(`IPC exception: ${error}`);
    }
  }

  async wait_subprocess_loaded() {
    return new Promise(resolve => {
      this.on_subprocess_loaded = resolve;
    });
  }

  async wait_page_loaded() {
    return new Promise(resolve => {
      this.on_page_loaded = resolve;
    });
  }

  async load(
    url: string,
    referrer?: string,
    referrer_policy?: ReferrerPolicy
  ) {
    return new Promise((resolve, reject) => {
      if (!this.native) {
        reject('Browser native not initialized');
        return;
      }
      this.native.stop_load();
      if (referrer) {
        const request = this.new_load_request(resolve, reject, url, referrer, referrer_policy);
        this.native.get_main_frame().load_request(request);
      } else {
        this.native.get_main_frame().load_url(url);
      }
      this.wait_loaded().then(_ => {
        this.native.stop_load();
        resolve();
      }).catch(reason => {
        reject(reason);
      });
    });
  }

  async wait_loaded() {
    const promises = [
      this.wait_subprocess_loaded(),
      this.wait_page_loaded()
    ];
    this.start_load_timer();
    await Promise.all(promises);
  }

  was_hidden(
    hidden: boolean
  ) {
    if (this.host) {
      this.host.was_hidden(hidden);
    }
  }

  async execute_js_and_wait_ipc(
    code: string,
    timeout_ms?: number
  ): Promise<ListValue> {
    return new Promise<ListValue>((resolve, reject) => {
      if (this.native) {
        this.on_ipc_message_resolve = resolve;
        this.on_ipc_message_reject = reject;
        this.native.get_main_frame().execute_java_script(
          this.wrap_js_code(code),
          URL_DEFAULT_SCRIPT,
          0
        );
        if (timeout_ms && timeout_ms > 0) {
          setTimeout(() => {
            this.reject_ipc_message('IPC message wait timeout');
          }, timeout_ms);
        }
      } else {
        reject('No native browser');
      }
    });
  }

  execute_js(
    code: string
  ) {
    this.native.get_main_frame().execute_java_script(
      this.wrap_js_code(code),
      URL_DEFAULT_SCRIPT,
      0
    );
  }

  async invalidate_view(): Promise<Image[]> {
    if (this.host) {
      return new Promise<Image[]>(resolve => {
        this.host.invalidate(PaintElementType.PET_VIEW);
        this.on_painted = resolve;
      });
    }
  }

  was_painted(
    images: Image[]
  ) {
    if (this.on_painted) {
      const resolve = this.on_painted;
      this.on_painted = undefined;
      resolve(images);
    }
  }

  notify_screen_info_changed() {
    if (this.host) {
      this.host.notify_screen_info_changed();
    }
  }

  get pino(): Pino {
    return this.tab.pino;
  }
}
