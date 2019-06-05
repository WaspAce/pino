import { IPinoBrowserClient } from './../browser_client_types';
import { IPinoRenderHandler, PinoRenderHandlerOptions } from './render_handler_types';

export class PinoRenderHandler implements IPinoRenderHandler {
  native: RenderHandler;

  private options: PinoRenderHandlerOptions;
  private monitor: Monitor;

  private init_options() {
    const user_options = this.client.options.render_handler;
    const default_options: PinoRenderHandlerOptions = {
      use_monitor: false
    };
    if (!user_options) {
      this.options = default_options;
    } else {
      this.options = Object.assign(default_options, user_options);
    }
  }

  private init_monitor() {
    if (this.options.use_monitor) {
      this.monitor = screen.get_monitor(0);
    }
  }

  private do_on_get_screen_point(
    browser: Browser,
    view_point: Point,
    screen_point: Point
  ): boolean {
    screen_point.x = view_point.x + this.monitor.x;
    screen_point.y = view_point.y + this.monitor.y;
    return true;
  }

  private init_native() {
    this.native = new RenderHandler(this);
    const view_rect = this.client.get_view_rect();
    this.native.root_screen_rect = new Rect();
    this.native.root_screen_rect.copy_from(view_rect);
    this.native.view_rect = new Rect();
    this.native.view_rect.copy_from(view_rect);
    this.native.screen_info = this.client.get_screen_info();
    if (this.monitor) {
      this.native.on_get_screen_point = this.do_on_get_screen_point;
    }
  }

  constructor(
    private readonly client: IPinoBrowserClient
  ) {
    this.init_options();
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
}
