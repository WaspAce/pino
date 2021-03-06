import { PinoScreen } from './screen/screen';
export const SP_INFO_INIT_SCRIPTS_INDEX = 0;

export class PinoApp {

  screen: PinoScreen;

  private define_initial_scripts(
    subprocess_info: ListValue
  ) {
    const scripts = new ListValue();
    scripts.set_size(this.initial_scripts.length);
    this.initial_scripts.forEach((source, index) => {
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
    CefApp.subprocess_info = info;
  }

  constructor(
    private readonly initial_scripts?: string[]
  ) {
    if (!this.initial_scripts) {
      this.initial_scripts = [];
    }
    CefApp.subprocess_source = './subprocess/subprocess.js';
    this.define_subprocess_info();
  }

  init() {
    CefApp.init();
    if (!this.screen) {
      this.screen = new PinoScreen();
    }
  }

  add_initial_scripts(
    scripts: string[]
  ) {
    if (scripts && scripts.length > 0) {
      const initial_scripts = CefApp.subprocess_info.get_list(SP_INFO_INIT_SCRIPTS_INDEX);
      const old_size = initial_scripts.size;
      initial_scripts.set_size(old_size + scripts.length);
      scripts.forEach((code, index) => {
        initial_scripts.set_string(index + old_size, code);
      });
    }
  }

  get app_loop_interval_ms(): number {
    return CefApp.loop_interval_ms;
  }

  set app_loop_interval_ms(
    value: number
  ) {
    CefApp.loop_interval_ms = value;
  }

  get gui_loop_interval_ms(): number {
    return system.gui_loop_interval_ms;
  }

  set gui_loop_interval_ms(
    value: number
  ) {
    system.gui_loop_interval_ms = value;
  }

  get user_agent(): string {
    return CefApp.settings.user_agent;
  }

  set user_agent(
    value: string
  ) {
    if (!CefApp.initialized) {
      CefApp.settings.user_agent = value;
    } else {
      throw new Error('Cannot set UserAgent after CefApp initialized');
    }
  }

  get initialized(): boolean {
    return CefApp.initialized;
  }
}
