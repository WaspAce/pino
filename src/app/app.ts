import { SP_INFO_INIT_SCRIPTS_INDEX } from './../pino_consts';

export class PinoApp {

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
    CEF_APP.subprocess_info = info;
  }

  constructor(
    private readonly initial_scripts?: string[]
  ) {
    if (!this.initial_scripts) {
      this.initial_scripts = [];
    }
    CEF_APP.subprocess_source = './subprocess/subprocess.js';
    this.define_subprocess_info();
  }

  init() {
    CEF_APP.init();
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

  get user_agent(): string {
    return CEF_APP.settings.user_agent;
  }

  set user_agent(
    value: string
  ) {
    if (!CEF_APP.initialized) {
      CEF_APP.settings.user_agent = value;
    } else {
      throw new Error('Cannot set UserAgent after CEF_APP initialized');
    }
  }

  get initialized(): boolean {
    return CEF_APP.initialized;
  }
}
