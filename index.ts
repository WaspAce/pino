import { PinoGui } from './gui';
import { PinoOptions } from './options';

export class Pino {
  private options: PinoOptions;
  private screen_info: ScreenInfo;
  private client: BrowserClient;
  private browser: Browser;
  private gui: PinoGui;

  private on_js_ipc_resolve: (value?: ListValue | PromiseLike<ListValue>) => void;
  private on_js_ipc_reject: (reason?: any) => void;

  private on_dom_ready_resolve: (value?: {} | PromiseLike<{}>) => void;
  private on_dom_ready_reject: (reason?: any) => void;

  private init_options(
    user_options: PinoOptions
  ) {
    const default_rect = new Rect();
    default_rect.x = 0;
    default_rect.y = 0;
    default_rect.width = 1920;
    default_rect.height = 1080;
    const default_options = {
      gui: false,
      loop_interval_ms: 10,
      aviable_rect: default_rect,
      screen_rect: default_rect,
      view_rect: default_rect,
      frame_rate: 60
    };
    if (!user_options) {
      this.options = default_options;
    } else {
      this.options = Object.assign(default_options, user_options);
    }
  }

  private init_app() {
    CEF_APP.subprocess_source = './subprocess.js';
    CEF_APP.init();
    CEF_APP.loop_interval_ms = this.options.loop_interval_ms;
    system.gui_loop_interval_ms = this.options.loop_interval_ms;
  }

  private init_screen() {
    this.screen_info = new ScreenInfo();
    this.screen_info.available_rect.copy_from(this.options.aviable_rect);
    this.screen_info.rect.copy_from(this.options.screen_rect);
    this.screen_info.depth = 24;
    this.screen_info.depth_per_component = 24;
    this.screen_info.device_scale_factor = 1;
    this.screen_info.is_monochrome = false;
  }

  private do_on_get_screen_point(
    browser: Browser,
    view_point: Point,
    screen_point: Point
  ): boolean {
    if (this.gui) {
      screen_point.x = view_point.x + this.gui.monitor.x;
      screen_point.y = view_point.y + this.gui.monitor.y;
    } else {
      screen_point.x = view_point.x;
      screen_point.y = view_point.y;
    }
    return true;
  }

  private create_render_handler() {
    this.client.render_handler = new RenderHandler(this);
    this.client.render_handler.root_screen_rect = new Rect();
    this.client.render_handler.root_screen_rect.x = 0;
    this.client.render_handler.root_screen_rect.y = 0;
    this.client.render_handler.root_screen_rect.width = 1920;
    this.client.render_handler.root_screen_rect.height = 1920;
    this.client.render_handler.view_rect = new Rect();
    this.client.render_handler.view_rect.copy_from(this.options.view_rect);
    this.client.render_handler.screen_info = this.screen_info;
    this.client.render_handler.on_get_screen_point = this.do_on_get_screen_point;
  }

  private do_on_load_end(
    browser: Browser,
    frame: Frame,
    http_code: number
  ) {
    if (frame.is_main && (http_code > 299 || http_code === 0)) {
      this.reject_dom_ready({
        http_code
      });
    }
  }

  private create_load_handler() {
    this.client.load_handler = new LoadHandler(this);
    this.client.load_handler.on_load_end = this.do_on_load_end;
  }

  private do_on_process_message_received(
    browser: Browser,
    source_process: ProcessId,
    message: ProcessMessage
  ) {
    if (message.name === 'dom_ready') {
      if (this.on_dom_ready_resolve) {
        const resolve = this.on_dom_ready_resolve;
        this.on_dom_ready_resolve = undefined;
        this.on_dom_ready_reject = undefined;
        resolve();
      }
    } else {
      if (this.on_js_ipc_resolve) {
        const resolve = this.on_js_ipc_resolve;
        this.on_js_ipc_resolve = undefined;
        this.on_js_ipc_reject = undefined;
        resolve(message.get_argument_list());
      }
    }
  }

  private reject_dom_ready(
    reason?: any
  ) {
    this.on_dom_ready_resolve = undefined;
    if (this.on_dom_ready_reject) {
      const reject = this.on_dom_ready_reject;
      this.on_dom_ready_reject = undefined;
      reject(reason);
    }
  }

  private reject_js_ipc(
    reason?: any
  ) {
    this.on_js_ipc_resolve = undefined;
    if (this.on_js_ipc_reject) {
      const reject = this.on_js_ipc_reject;
      this.on_js_ipc_reject = undefined;
      reject(reason);
    }
  }

  private reject_all_wait_promises(
    reason?: any
  ) {
    this.reject_dom_ready(reason);
    this.reject_js_ipc(reason);
  }

  private do_on_render_process_terminated(
    browser: Browser,
    status: TerminationStatus
  ) {
    this.reject_all_wait_promises({
      termination_status: status
    });
  }

  private create_request_handler() {
    this.client.request_handler = new RequestHandler(this);
    this.client.request_handler.on_render_process_terminated = this.do_on_render_process_terminated;
  }

  private create_client() {
    this.client = new BrowserClient(this);
    this.create_render_handler();
    this.create_load_handler();
    this.create_request_handler();
    this.client.on_process_message_received = this.do_on_process_message_received;
  }

  private create_browser() {
    const window_info = new WindowInfo();
    const settings = new BrowserSettings();
    settings.frame_rate = this.options.frame_rate;

    this.browser = new Browser(
      window_info,
      this.client,
      '',
      settings
    );
  }

  private init_browser() {
    this.init_screen();
    this.create_client();
    this.create_browser();
  }

  private init_gui() {
    if (this.options.gui) {
      this.gui = new PinoGui(
        this.client,
        this.browser.get_host()
      );
    }
  }

  constructor(
    options?: PinoOptions
  ) {
    this.init_options(options);
    this.init_app();
    this.init_browser();
    this.init_gui();
  }

  async load(
    url: string
  ) {
    this.on_dom_ready_resolve = undefined;
    this.on_dom_ready_reject = undefined;
    return new Promise((resolve, reject) => {
      if (this.browser.is_loading) {
        this.browser.stop_load();
      }
      this.on_dom_ready_resolve = resolve;
      this.on_dom_ready_reject = reject;
      this.browser.get_main_frame().load_url(url);
    });
  }

  execute_js(
    code: string
  ) {
    this.browser.get_main_frame().execute_java_script(
      code,
      'http://internal-script.wa',
      0
    );
  }

  async execute_js_and_wait_ipc(
    code: string
  ): Promise<ListValue> {
    return new Promise<ListValue>((resolve, reject) => {
      this.on_js_ipc_resolve = resolve;
      this.on_js_ipc_reject = reject;
      this.execute_js(code);
    });
  }

  async execute_js_and_wait_dom_ready(
    code: string
  ) {
    this.on_dom_ready_resolve = undefined;
    this.on_dom_ready_reject = undefined;
    return new Promise((resolve, reject) => {
      if (this.browser.is_loading) {
        this.browser.stop_load();
      }
      this.on_dom_ready_resolve = resolve;
      this.on_dom_ready_reject = reject;
      this.execute_js(code);
    });
  }
}
