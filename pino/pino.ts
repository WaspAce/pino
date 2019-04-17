import { PinoGui } from './gui';
import { PinoOptions } from './options';

// export default class Pino {

//   private monitor: Monitor;
//   private screen_info: ScreenInfo;

//   private browser: Browser;
//   private host: BrowserHost;
//   private client: BrowserClient;
//   private scheme_handler_factory: SchemeHandlerFactory;
//   private client_scheme_handler: ResourceHandler;
//   private test_scheme_response_bytes: number[];
//   private last_ticks: number = 0;

//   private do_on_scheme_handler_create(
//     browser: Browser,
//     frame: Frame,
//     scheme_name: string,
//     request: Request
//   ): ResourceHandler {
//     console.log('DO ON SCHEME HANDLER CREATE: ', request.url);
//     return this.client_scheme_handler;
//   };

//   private do_on_process_scheme_request(
//     request: Request,
//     callback: Callback
//   ): boolean {
//     console.log('DO ON PROCESS SCHEME REQUEST: ', request.url);
//     callback.cont();
//     return true;
//   };

//   private do_on_get_scheme_response_headers(
//     response: Response
//   ): {
//     response_length: number,
//     redirect_url: string
//   } {
//     console.log('DO ON GET SCHEME RESPONSE HEADERS: ');
//     response.mime_type = 'text/html';
//     response.status = 200;
//     response.error = CefErrorCode.ERR_NONE;
//     response.url = 'client://tests/handler.html';
//     response.status_text = 'Success';
//     return {
//       response_length: this.test_scheme_response_bytes.length,
//       redirect_url: ""
//     }
//   }

//   private do_on_scheme_read_response(
//     bytes_to_read: number,
//     callback: Callback
//   ): {
//     data_out: number[],
//     bytes_read: number,
//     result: boolean
//   } {
//     console.log('DO ON SCHEME READ RESPONSE: ');
//     return {
//       data_out: this.test_scheme_response_bytes,
//       bytes_read: this.test_scheme_response_bytes.length,
//       result: true
//     }
//   };

//   do_on_register_custom_schemes() {
//     console.log('DO ON REGISTER CUSTOM SCHEMES');
//   }

//   private init_app() {
//     let scheme = new CustomScheme();
//     scheme.scheme_name = 'client';
//     scheme.is_standard = true;
//     scheme.is_secure = false;
//     scheme.is_local = false;
//     scheme.is_display_isolated = false;
//     scheme.is_csp_bypassing = true;
//     scheme.is_cors_enabled = false;
//     CEF_APP.add_custom_scheme(scheme);

//     CEF_APP.init();

//     this.scheme_handler_factory = new SchemeHandlerFactory(this);
//     this.scheme_handler_factory.on_create = this.do_on_scheme_handler_create;
//     CEF_APP.register_scheme_handler_factory(
//       'client',
//       'tests',
//       this.scheme_handler_factory
//     );

//     CEF_APP.loop_interval_ms = 1;
//     system.gui_loop_interval_ms = 1;
//     //CEF_APP.subprocess_source = './subprocess.js';

//     this.client_scheme_handler = new ResourceHandler(this);
//     this.client_scheme_handler.on_process_request =  this.do_on_process_scheme_request;
//     this.client_scheme_handler.on_get_response_headers = this.do_on_get_scheme_response_headers;
//     this.client_scheme_handler.on_read_response = this.do_on_scheme_read_response;
//   }

//   private create_gui() {
//     this.create_form();
//     this.create_view();
//   }

//   private init_screen() {
//     this.monitor = screen.get_monitor(0);
//     this.screen_info = new ScreenInfo();
//     this.screen_info.available_rect.copy_from(this.monitor.bounds_rect);
//     this.screen_info.rect.copy_from(this.monitor.bounds_rect);
//     this.screen_info.depth = 24;
//     this.screen_info.depth_per_component = 24;
//     this.screen_info.device_scale_factor = 1;
//     this.screen_info.is_monochrome = false;
//   }

//   private do_on_paint(
//     browser: Browser,
//     images: Image[]
//   ) {
//     images[0].save_to_file('/home/koshak/pino.png');
//   };

//   private create_client() {
//     this.client = new BrowserClient();
//     this.client.render_handler = new RenderHandler(this);
//     this.client.render_handler.root_screen_rect = new Rect();
//     this.client.render_handler.root_screen_rect.x = 0;
//     this.client.render_handler.root_screen_rect.y = 0;
//     this.client.render_handler.root_screen_rect.width = 1920;
//     this.client.render_handler.root_screen_rect.height = 1920;

//     this.client.render_handler.view_rect = new Rect();
//     this.client.render_handler.view_rect.copy_from(this.view.rect);
//     this.client.render_handler.screen_info = this.screen_info;
//     this.client.render_handler.on_get_screen_point = this.do_on_get_screen_point;
//     this.client.render_handler.add_draw_targets([this.view]);
//     //this.client.render_handler.on_paint = this.do_on_paint;
//   }

//   private create_browser() {
//     let window_info = new WindowInfo();
//     window_info.external_begin_frame_enabled = true;

//     let settings = new BrowserSettings();
//     settings.frame_rate = 60;

//     this.browser = new Browser(
//       window_info,
//       this.client,
//       'https://www.youtube.com/watch?v=vuT_bXzhqhY&play=true',
//       settings
//     );
//     this.host = this.browser.get_host();
//   }

//   private init_browser() {
//     this.init_screen();
//     this.create_client();
//     this.create_browser();
//   }

//   constructor() {
//     this.init_app();
//     this.create_gui();
//     this.init_browser();
//   }
// }

export class Pino {
  private screen_info: ScreenInfo;
  private client: BrowserClient;
  private gui: PinoGui;

  private init_options() {
    if (!this.options) {
      this.options = {
        gui: false,
        loop_interval_ms: 10
      };
    }
  }

  private init_app() {
    CEF_APP.init();
    CEF_APP.loop_interval_ms = this.options.loop_interval_ms;
    system.gui_loop_interval_ms = this.options.loop_interval_ms;
    // CEF_APP.subprocess_source = './subprocess.js';
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
    this.client.render_handler.add_draw_targets([this.view]);
  }

  private init_browser() {
    this.init_screen();
    this.create_client();
    this.create_browser();
  }

  constructor(
    private options?: PinoOptions
  ) {
    this.init_options();
    this.init_app();
    this.init_browser();
    if (this.options.gui) {
      this.gui = new PinoGui();
    }
  }

  async load(
    url: string
  ) {
    console.log('load: ', url);
  }
}
