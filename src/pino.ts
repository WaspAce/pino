import { SP_INFO_INIT_SCRIPTS_INDEX } from './subprocess_types';
import { PinoTab } from './tab/tab';
import { PinoGui } from './gui/gui';
import { IPino, PinoOptions } from './pino_types';

export class Pino implements IPino {

  screen_info: ScreenInfo;
  options: PinoOptions;
  gui: PinoGui;

  private active_tab: PinoTab;
  private tabs_by_gui_tab_index = new Map<number, PinoTab>();

  private get_default_rect() {
    const result = new Rect();
    result.x = 0;
    result.y = 0;
    result.width = 1920;
    result.height = 1080;
    return result;
  }

  private init_options(
    user_options: PinoOptions
  ) {
    const default_rect = this.get_default_rect();
    const default_options: PinoOptions = {
      gui: false,
      view_rect: default_rect,
      screen: {
        color_depth: 24,
        device_scale_factor: 1,
        is_monochrome: false,
        rect: default_rect,
        available_rect: default_rect
      },
      tab: {
        browser: {
          client: {
            render_handler: {
            }
          }
        }
      },
      app_loop_interval_ms: 5,
      gui_loop_interval_ms: 5,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.108 Safari/537.36'
    };
    if (!user_options) {
      this.options = default_options;
    } else {
      this.options = Object.assign(default_options, user_options);
    }
    if (this.options.gui) {
      this.options.tab.browser.client.render_handler.use_monitor = true;
    }
  }

  private init_screen_info() {
    this.screen_info = new ScreenInfo();
    let monitor: Monitor;
    const default_rect = this.get_default_rect();
    if (this.options.gui) {
      monitor = screen.get_monitor(0);
    }
    if (this.options.screen && this.options.screen.rect){
      this.screen_info.rect.copy_from(this.options.screen.rect);
    } else if (this.options.gui) {
      this.screen_info.rect.copy_from(monitor.bounds_rect);
    } else {
      this.screen_info.rect.copy_from(default_rect);
    }
    if (this.options.screen && this.options.screen.available_rect){
      this.screen_info.available_rect.copy_from(this.options.screen.available_rect);
    } else if (this.options.gui) {
      this.screen_info.available_rect.copy_from(monitor.workarea_rect);
    } else {
      this.screen_info.available_rect.copy_from(default_rect);
    }
    this.screen_info.depth = this.options.screen.color_depth;
    this.screen_info.depth_per_component = this.options.screen.color_depth;
    this.screen_info.device_scale_factor = this.options.screen.device_scale_factor;
    this.screen_info.is_monochrome = this.options.screen.is_monochrome;
  }

  private create_gui() {
    if (this.options.gui) {
      this.gui = new PinoGui(this);
    }
  }

  private define_initial_scripts(
    subprocess_info: ListValue
  ) {
    const scripts = new ListValue();
    if (this.options.initial_scripts && this.options.initial_scripts.length > 0) {
      scripts.set_size(this.options.initial_scripts.length);
      this.options.initial_scripts.forEach((source, index) => {
        scripts.set_string(index, source);
      });
    }
    subprocess_info.set_list(SP_INFO_INIT_SCRIPTS_INDEX, scripts);
  }

  private define_subprocess_info() {
    const info = new ListValue();
    info.set_size(1);
    this.define_initial_scripts(info);
    CEF_APP.subprocess_info = info;
  }

  private init_app() {
    CEF_APP.subprocess_source = './subprocess.js';
    this.define_subprocess_info();
    CEF_APP.init();
    CEF_APP.loop_interval_ms = this.options.app_loop_interval_ms;
    CEF_APP.settings.user_agent = this.options.user_agent;
    system.gui_loop_interval_ms = this.options.gui_loop_interval_ms;
  }

  constructor(
    user_options: PinoOptions
  ) {
    this.init_options(user_options);
    this.init_screen_info();
    this.init_app();
    this.create_gui();
  }

  get_view_rect(): Rect {
    if (this.gui) {
      return this.gui.view.rect;
    } else {
      return this.options.view_rect;
    }
  }

  view_resized(
    view_rect: Rect
  ): void {
    if (this.active_tab) {
      this.active_tab.view_resized(view_rect);
    }
  }

  active_tab_index_changed(
    gui_active_tab_index: number
  ) {
    this.tabs_by_gui_tab_index.forEach(pino_tab => {
      if (pino_tab.gui_tab_index === gui_active_tab_index) {
        pino_tab.was_hidden(false);
        this.active_tab = pino_tab;
      } else {
        pino_tab.was_hidden(true);
      }
    });
  }

  send_mouse_wheel_event(
    event: MouseEvent,
    delta: number
  ) {
    if (this.active_tab) {
      this.active_tab.send_mouse_wheel_event(event, delta);
    }
  }

  send_mouse_down_event(
    event: MouseEvent,
    button: MouseButtonType
  ) {
    if (this.active_tab) {
      this.active_tab.send_mouse_down_event(event, button);
    }
  }

  send_mouse_up_event(
    event: MouseEvent,
    button: MouseButtonType
  ) {
    if (this.active_tab) {
      this.active_tab.send_mouse_up_event(event, button);
    }
  }

  send_mouse_move_event(
    event: MouseEvent
  ) {
    if (this.active_tab) {
      this.active_tab.send_mouse_move_event(event);
    }
  }

  send_key_press(
    event: KeyEvent
  ) {
    if (this.active_tab) {
      this.active_tab.send_key_press(event);
    }
  }

  send_key_down(
    event: KeyEvent
  ) {
    if (this.active_tab) {
      this.active_tab.send_key_down(event);
    }
  }

  send_key_up(
    event: KeyEvent
  ) {
    if (this.active_tab) {
      this.active_tab.send_key_up(event);
    }
  }

  async add_tab(): Promise<PinoTab> {
    let gui_tab_index = -1;
    if (this.gui) {
      gui_tab_index = await this.gui.add_tab();
    }
    const result = new PinoTab(this, true);
    await result.wait_initialized();
    result.gui_tab_index = gui_tab_index;
    this.tabs_by_gui_tab_index.set(gui_tab_index, result);
    if (this.gui) {
      if (this.gui.tabs.active_tab_index !== gui_tab_index) {
        result.was_hidden(true);
      }
    }
    if (!this.active_tab) {
      this.active_tab = result;
    }
    return result;
  }
}
