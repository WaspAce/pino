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

  private do_on_paint(
    browser: Browser,
    images: Image[]
  ) {
    this.client.browser.was_painted(images);
  }

  private init_native() {
    this.native = new RenderHandler(this);
    this.native.root_screen_rect = this.pino.screen.root_screen_rect;
    this.native.view_rect = this.pino.screen.view_rect;
    this.native.screen_info = this.pino.screen.screen_info;
    if (this.monitor) {
      this.native.on_get_screen_point = this.do_on_get_screen_point;
    }
    this.native.on_paint = this.do_on_paint;
  }

  constructor(
    private readonly client: PinoBrowserClient
  ) {
    this.init_monitor();
    this.init_native();
  }

  add_draw_target(
    target: GuiPanel
  ) {
    this.native.add_draw_targets([target]);
  }

  was_resized(
    view_rect: Rect
  ) {
    this.native.view_rect.copy_from(view_rect);
  }

  get pino(): Pino {
    return this.client.pino;
  }
}
