export class PinoScreen {

  screen_info: ScreenInfo;
  root_screen_rect: Rect;
  view_rect: Rect;
  is_default = true;

  private default_rect: Rect;

  private create_default_rect() {
    this.default_rect = new Rect();
    this.default_rect.x = 0;
    this.default_rect.y = 0;
    this.default_rect.width = 1920;
    this.default_rect.height = 1080;
  }

  private init_rects() {
    this.root_screen_rect = new Rect();
    this.root_screen_rect.copy_from(this.default_rect);

    this.view_rect = new Rect();
    this.view_rect.copy_from(this.default_rect);
  }

  private init_screen_info() {
    this.screen_info = new ScreenInfo();
    this.screen_info.rect.copy_from(this.root_screen_rect);
    this.screen_info.available_rect.copy_from(this.default_rect);
    this.screen_info.depth = 24;
    this.screen_info.depth_per_component = 24;
    this.screen_info.device_scale_factor = 1;
    this.screen_info.is_monochrome = false;
  }

  constructor() {
    this.create_default_rect();
    this.init_rects();
    this.init_screen_info();
  }
}
