import { PinoLoadHandler } from './load_handler/load_handler';
import { PinoLifeSpanHandler } from './life_span_handler/life_span_handler';
import { IPinoBrowserClient, PinoBrowserClientOptions } from './browser_client_types';
import { IPinoBrowser } from './../browser_types';
import { PinoRenderHandler } from './render_handler/render_handler';

export class PinoBrowserClient implements IPinoBrowserClient {
  options: PinoBrowserClientOptions;
  native: BrowserClient;

  private render_handler: PinoRenderHandler;
  private life_span_handler: PinoLifeSpanHandler;
  private load_handler: PinoLoadHandler;

  private init_options() {
    const user_options = this.browser.options.client;
    const default_options: PinoBrowserClientOptions = {};
    if (!user_options) {
      this.options = default_options;
    } else {
      this.options = Object.assign(default_options, user_options);
    }
  }

  private create_render_handler() {
    this.render_handler = new PinoRenderHandler(this);
    this.native.render_handler = this.render_handler.native;
  }

  private create_life_span_handler() {
    this.life_span_handler = new PinoLifeSpanHandler(this);
    this.native.life_span_handler = this.life_span_handler.native;
  }

  private create_load_handler() {
    this.load_handler = new PinoLoadHandler(this);
    this.native.load_handler = this.load_handler.native;
  }

  private do_on_process_message_received(
    browser: Browser,
    source_process: ProcessId,
    message: ProcessMessage
  ) {
    this.browser.process_message_received(message);
  }

  private create_client() {
    this.native = new BrowserClient(this);
    this.create_render_handler();
    this.create_life_span_handler();
    this.create_load_handler();
    this.native.on_process_message_received = this.do_on_process_message_received;
  }

  constructor(
    private readonly browser: IPinoBrowser
  ) {
    this.init_options();
    this.create_client();
  }

  browser_created(
    browser: Browser
  ) {
    this.browser.browser_created(browser);
  }

  page_loaded() {
    this.browser.page_loaded();
  }

  get_screen_info(): ScreenInfo {
    return this.browser.get_screen_info();
  }

  get_view_rect(): Rect {
    return this.browser.get_view_rect();
  }

  add_draw_target(
    target: GuiPanel
  ) {
    this.render_handler.add_draw_target(target);
  }

  was_resized(
    view_rect: Rect
  ) {
    this.render_handler.was_resized(view_rect);
  }
}
