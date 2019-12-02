import { PinoContextMenuHandler } from './context_menu_handler/context_menu_handler';
import { IPC_PAGE_LOADED } from './../../../subprocess/render_process_handler/load_handler/load_handler';
import { Pino } from './../../../pino';
import { PinoLoadHandler } from './load_handler/load_handler';
import { PinoBrowser } from './../browser';
import { PinoRequestHandler } from './request_handler/request_handler';
import { PinoDisplayHandler } from './display_handler/display_handler';
import { PinoLifeSpanHandler } from './life_span_handler/life_span_handler';
import { PinoRenderHandler } from './render_handler/render_handler';

export class PinoBrowserClient {
  native: BrowserClient;

  private render_handler: PinoRenderHandler;
  private life_span_handler: PinoLifeSpanHandler;
  private display_handler: PinoDisplayHandler;
  private request_handler: PinoRequestHandler;
  private load_handler: PinoLoadHandler;
  private context_menu_handler: PinoContextMenuHandler;

  private create_render_handler() {
    this.render_handler = new PinoRenderHandler(this);
    this.native.render_handler = this.render_handler.native;
  }

  private create_life_span_handler() {
    this.life_span_handler = new PinoLifeSpanHandler(this);
    this.native.life_span_handler = this.life_span_handler.native;
  }

  private create_display_handler() {
    this.display_handler = new PinoDisplayHandler(this);
    this.native.display_handler = this.display_handler.native;
  }

  private create_request_handler() {
    this.request_handler = new PinoRequestHandler(this);
    this.native.request_handler = this.request_handler.native;
  }

  private create_load_handler() {
    this.load_handler = new PinoLoadHandler(this);
    this.native.load_handler = this.load_handler.native;
  }

  private create_context_menu_handler() {
    this.context_menu_handler = new PinoContextMenuHandler(this);
    this.native.context_menu_handler = this.context_menu_handler.native;
  }

  private do_on_process_message_received(
    browser: Browser,
    frame: Frame,
    source_process: ProcessId,
    message: ProcessMessage
  ) {
    if (message.name === IPC_PAGE_LOADED) {
      this.browser.subprocess_loaded();
    } else {
      this.browser.process_message_received(frame.identifier, message);
    }
  }

  private create_client() {
    this.native = new BrowserClient(this);
    this.create_render_handler();
    this.create_life_span_handler();
    this.create_display_handler();
    this.create_request_handler();
    // this.create_load_handler();
    this.create_context_menu_handler();
    this.native.on_process_message_received = this.do_on_process_message_received;
  }

  constructor(
    readonly browser: PinoBrowser
  ) {
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

  add_draw_target(
    target: Image
  ) {
    this.render_handler.add_draw_target(target);
  }

  get pino(): Pino {
    return this.browser.pino;
  }
}
