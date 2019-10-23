import { SP_INFO_INIT_SCRIPTS_INDEX, DEFAULT_USER_AGENT } from './pino_consts';
import { PinoTab } from './tab/tab';
import { PinoGui } from './gui/gui';
import { PinoScreen } from './screen/screen';

export class Pino {

  screen = new PinoScreen(this);
  gui: PinoGui;
  on_get_auth_credentials: (
    browser: Browser,
    origin_url: string,
    is_proxy: boolean,
    host: string,
    port: string,
    realm: string,
    scheme: string
  ) => {
    username: string;
    password: string
  };

  frame_rate = 30;
  load_timeout_ms = 20000;
  initial_scripts: string[] = [];
  user_agent = '';
  block_subframes = false;

  private active_tab: PinoTab;
  private tabs_by_gui_tab_index = new Map<number, PinoTab>();
  private default_scripts = [
    loader.load_from_file('assets://jquery.min.js'),
    loader.load_from_file('assets://misc.js')
  ];

  private get_default_rect() {
    const result = new Rect();
    result.x = 0;
    result.y = 0;
    result.width = 1920;
    result.height = 1080;
    return result;
  }

  private create_gui() {
    this.gui = new PinoGui(this);
  }

  private define_initial_scripts(
    subprocess_info: ListValue
  ) {
    const scripts = new ListValue();
    const sources = this.default_scripts.concat(this.initial_scripts);
    scripts.set_size(sources.length);
    sources.forEach((source, index) => {
      scripts.set_string(index, source);
    });
    if (subprocess_info.size < SP_INFO_INIT_SCRIPTS_INDEX + 1) {
      subprocess_info.set_size(SP_INFO_INIT_SCRIPTS_INDEX + 1);
    }
    subprocess_info.set_list(SP_INFO_INIT_SCRIPTS_INDEX, scripts);
  }

  private define_subprocess_info() {
    const info = new ListValue();
    this.define_initial_scripts(info);
    CEF_APP.subprocess_info = info;
  }

  private init_app() {
    CEF_APP.subprocess_source = './subprocess/subprocess.js';
    this.define_subprocess_info();
    CEF_APP.init();
    CEF_APP.loop_interval_ms = this.app_loop_interval_ms;
    if (this.user_agent !== '') {
      CEF_APP.settings.user_agent = this.user_agent;
    }
    system.gui_loop_interval_ms = this.gui_loop_interval_ms;
  }

  private async process_new_tab(
    tab: PinoTab
  ): Promise<PinoTab> {
    await tab.wait_initialized();
    let gui_tab_index = -1;
    if (this.gui) {
      gui_tab_index = await this.gui.add_tab();
    }
    tab.gui_tab_index = gui_tab_index;
    this.tabs_by_gui_tab_index.set(gui_tab_index, tab);
    if (this.gui) {
      if (this.gui.tabs.active_tab_index !== gui_tab_index) {
        tab.was_hidden(true);
      }
    }
    if (!this.active_tab) {
      this.active_tab = tab;
    }
    return tab;
  }

  constructor(
    gui?: boolean,
    initial_scripts?: string[]
  ) {
    if (initial_scripts) {
      this.initial_scripts = initial_scripts;
    }
    this.init_app();
    if (gui) {
      this.create_gui();
    }
  }

  async init() {
    if (this.gui) {
      await this.gui.init();
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

  add_tab_sync(): PinoTab {
    const result = new PinoTab(this, true);
    this.process_new_tab(result);
    return result;
  }

  async add_tab(): Promise<PinoTab> {
    const result = new PinoTab(this, true);
    return this.process_new_tab(result);
  }

  async repaint(): Promise<Image[]> {
    if (this.active_tab) {
      return this.active_tab.browser.invalidate_view();
    }
  }

  screen_changed() {
    if (this.gui) {
      this.gui.screen_changed();
    }
    this.tabs_by_gui_tab_index.forEach(tab => {
      tab.browser.notify_screen_info_changed();
    });
  }

  get app_loop_interval_ms(): number {
    return CEF_APP.loop_interval_ms;
  }

  set app_loop_interval_ms(
    value: number
  ) {
    CEF_APP.loop_interval_ms = value;
  }

  get gui_loop_interval_ms(): number {
    return system.gui_loop_interval_ms;
  }

  set gui_loop_interval_ms(
    value: number
  ) {
    system.gui_loop_interval_ms = value;
  }
}
