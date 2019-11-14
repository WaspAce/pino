import { Pino } from './../../../../pino';
import { PinoBrowserClient } from '../browser_client';

export class PinoRenderHandler {
  native: RenderHandler;

  private monitor: Monitor;

  private init_monitor() {
    if (this.pino.gui) {
      this.monitor = screen.get_monitor(0);
    }
  }

  private do_on_get_screen_point(
    browser: Browser,
    view_point: Point,
    screen_point: Point
  ): boolean {
    if (this.monitor) {
      screen_point.x = view_point.x + this.monitor.x;
      screen_point.y = view_point.y + this.monitor.y;
      return true;
    } else {
      return false;
    }
  }

  private do_on_painted(
    browser: Browser
  ) {
    this.client.browser.was_painted();
    if (this.pino.on_painted) {
      this.pino.on_painted(browser);
    }
  }

  private init_native() {
    this.native = new RenderHandler(this);
    this.native.root_screen_rect = this.pino.app.screen.root_screen_rect;
    this.native.view_rect = this.pino.app.screen.view_rect;
    this.native.screen_info = this.pino.app.screen.screen_info;
    if (this.monitor) {
      this.native.on_get_screen_point = this.do_on_get_screen_point;
    }
    this.native.on_painted = this.do_on_painted;
  }

  constructor(
    private readonly client: PinoBrowserClient
  ) {
    this.init_monitor();
    this.init_native();
  }

  add_draw_target(
    target: Image
  ) {
    this.native.add_draw_targets([target]);
  }

  get pino(): Pino {
    return this.client.pino;
  }
}
