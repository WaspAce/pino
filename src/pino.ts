import { PinoTab } from './tab/tab';
import { PinoGui } from './gui/gui';
import { PinoScreen } from './screen/screen';

export class Pino {

  screen: PinoScreen;
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
  block_subframes = false;
  is_mobile = false;

  private active_tab: PinoTab;
  private tabs_by_gui_tab_index = new Map<number, PinoTab>();

  private create_gui() {
    this.gui = new PinoGui(this);
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
    gui?: boolean
  ) {
    if (gui) {
      this.create_gui();
    }
  }

  async init() {
    if (!this.screen) {
      this.screen = new PinoScreen();
    }
    if (this.gui) {
      await this.gui.init();
    }
  }

  view_resized(): void {
    this.tabs_by_gui_tab_index.forEach(tab => {
      tab.view_resized();
    });
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

  send_touch_event(
    event: TouchEvent
  ) {
    if (this.active_tab) {
      this.active_tab.send_touch_event(event);
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
}
