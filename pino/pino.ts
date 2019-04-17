import { PinoGui } from './gui';
import { PinoOptions } from './options';

export class Pino {
  private options: PinoOptions;
  private screen_info: ScreenInfo;
  private client: BrowserClient;
  private browser: Browser;
  private gui: PinoGui;

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
      frame_rate: 60,
      default_url: 'about:blank'
    };
    if (!user_options) {
      this.options = default_options;
    } else {
      this.options = Object.assign(default_options, user_options);
    }
  }

  private init_app() {
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

  private create_client() {
    this.client = new BrowserClient();
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

  private create_browser() {
    const window_info = new WindowInfo();
    const settings = new BrowserSettings();
    settings.frame_rate = this.options.frame_rate;

    this.browser = new Browser(
      window_info,
      this.client,
      this.options.default_url,
      settings
    );
  }

  private init_browser() {
    this.init_screen();
    this.create_client();
    this.create_browser();
  }

  constructor(
    options?: PinoOptions
  ) {
    this.init_options(options);
    this.init_app();
    this.init_browser();
    if (this.options.gui) {
      this.gui = new PinoGui(
        this.client,
        this.browser.get_host()
      );
    }
  }

  async load(
    url: string
  ) {
    console.log('load: ', url);
  }
}
