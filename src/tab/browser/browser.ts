import { IPC_V8_BRIDGE_MSG } from '../v8_bridge/v8_bridge_message/v8_bridge_message';
import { Pino } from './../../pino';
import { PinoBrowserClient } from './browser_client/browser_client';
import { PinoTab } from '../tab';
import { URI } from '../../uri/uri';
import { PinoFrame } from './frame/frame';
import { clearTimeout, setTimeout } from '../../timers/timers';

const URL_BLANK_PAGE = 'about:blank';

export class PinoBrowser {
  native: Browser;
  client: PinoBrowserClient;

  private host: BrowserHost;
  private on_subprocess_loaded: (value?: any) => void;
  private on_page_loaded: (value?: any) => void;
  private load_timeout = -1;
  private on_painted: () => void;
  private frames_by_id = new Map<number, PinoFrame>();
  private f_frames: PinoFrame[] = [];

  private init_client() {
    this.client = new PinoBrowserClient(this);
  }

  private init_browser() {
    if (this.create_browser) {
      const window_info = new WindowInfo();
      const settings = new BrowserSettings();
      settings.frame_rate = this.pino.frame_rate;
      settings.web_security = false;

      CefApp.create_browser(
        window_info,
        this.client.native,
        URL_BLANK_PAGE,
        settings
      );
    }
  }

  private start_load_timer(
    timeout_ms: number
  ) {
    if (this.load_timeout > -1) {
      clearTimeout(this.load_timeout);
      this.load_timeout = -1;
    }
    this.load_timeout = setTimeout(() => {
      this.load_timeout = -1;
      this.page_loaded();
      this.subprocess_loaded();
    },
    timeout_ms);
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

  private update_frames() {
    const frame_ids = this.native.get_frame_identifiers();
    const new_frames_by_id = new Map<number, PinoFrame>();
    frame_ids.forEach(frame_id => {
      if (this.frames_by_id.has(frame_id)) {
        const frame = this.frames_by_id.get(frame_id);
        frame.children = [];
        new_frames_by_id.set(frame_id, frame);
      } else {
        const native_frame = this.native.get_frame_by_identifier(frame_id);
        const frame = new PinoFrame(
          native_frame,
          this
        );
        new_frames_by_id.set(frame_id, frame);
      }
    });
    this.frames_by_id = new_frames_by_id;

    this.f_frames = [];
    frame_ids.forEach(frame_id => {
      const frame = this.frames_by_id.get(frame_id);
      this.f_frames.push(frame);
      if (!frame.native.is_main) {
        const parent_frame = this.frames_by_id.get(frame.native.get_parent().identifier);
        frame.parent = parent_frame;
        parent_frame.children.push(frame);
      }
    });
  }

  private process_frame_message(
    message: ProcessMessage,
    frame: Frame
  ) {
    this.update_frames();
    if (this.frames_by_id.has(frame.identifier)) {
      this.frames_by_id.get(frame.identifier).receive_ipc_message(message);
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
    target: Image
  ) {
    this.client.add_draw_target(target);
  }

  was_resized() {
    if (this.host) {
      this.host.was_resized();
    }
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
    event: MouseEvent,
    mouse_leave?: boolean
  ) {
    if (this.host) {
      this.host.send_mouse_move_event(event, mouse_leave);
    }
  }

  send_touch_event(
    event: TouchEvent
  ) {
    if (this.host) {
      this.host.send_touch_event(event);
    }
  }

  send_key_event(
    event: KeyEvent
  ) {
    if (this.host) {
      this.host.send_key_event(event);
    }
  }

  process_message_received(
    message: ProcessMessage,
    frame: Frame
  ) {
    if (message.name === IPC_V8_BRIDGE_MSG) {
      this.process_frame_message(message, frame);
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

  async wait_loaded(
    timeout_ms?: number
  ) {
    const promises = [
      this.wait_subprocess_loaded(),
      this.wait_page_loaded()
    ];
    if (timeout_ms && timeout_ms > 0) {
      this.start_load_timer(timeout_ms);
    }
    await Promise.all(promises);
  }

  was_hidden(
    hidden: boolean
  ) {
    if (this.host) {
      this.host.was_hidden(hidden);
    }
  }

  async invalidate_view(): Promise<Image[]> {
    if (this.host) {
      return new Promise<Image[]>(resolve => {
        this.host.invalidate(PaintElementType.PET_VIEW);
        this.on_painted = resolve;
      });
    }
  }

  was_painted() {
    this.tab.was_painted();
    if (this.on_painted) {
      const resolve = this.on_painted;
      this.on_painted = undefined;
      resolve();
    }
  }

  notify_screen_info_changed() {
    if (this.host) {
      this.host.notify_screen_info_changed();
    }
  }

  get_frame_by_id(
    id: number
  ): PinoFrame {
    this.update_frames();
    if (this.frames_by_id.has(id)) {
      return this.frames_by_id.get(id);
    } else {
      return undefined;
    }
  }

  get_frame_by_index(
    index: number
  ): PinoFrame {
    this.update_frames();
    if (this.f_frames.length > index) {
      return this.f_frames[index];
    }
  }

  get_main_frame(): PinoFrame {
    const main_frame_id = this.native.get_main_frame().identifier;
    return this.get_frame_by_id(main_frame_id);
  }

  get pino(): Pino {
    return this.tab.pino;
  }

  get frames(): PinoFrame[] {
    this.update_frames();
    return this.f_frames;
  }
}
