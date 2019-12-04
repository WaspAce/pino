import { PinoSubprocessRenderProcessHandler } from '../render_process_handler';
import { PinoV8Context } from '../../v8_bridge/v8_context/v8_context';

export const URL_DEFAULT_SCRIPT = 'http://custom_js.wa';
export const IPC_PAGE_LOADED = 'page_loaded';

export class PinoSubprocessLoadHandler {

  native: LoadHandler;

  private execute_initial_scripts(
    frame: Frame
  ) {
    if (frame && frame.is_valid) {
      this.render_process_handler.subprocess.initial_scritps.forEach(source => {
        frame.execute_java_script(
          source,
          URL_DEFAULT_SCRIPT,
          0
        );
      });
    }
  }

  private do_on_load_end(
    browser: Browser,
    frame: Frame,
    http_status_code: number
  ) {
    this.execute_initial_scripts(frame);
  }

  private do_on_loading_state_change(
    browser: Browser,
    is_loading: boolean,
    can_go_back: boolean,
    can_go_forward: boolean
  ) {
    if (!is_loading) {
      const message = new ProcessMessage(IPC_PAGE_LOADED);
      browser.get_main_frame().send_process_message(ProcessId.PID_BROWSER, message);
    }
  }

  private init_native() {
    this.native = new LoadHandler(this);
    this.native.on_load_end = this.do_on_load_end;
    this.native.on_loading_state_change = this.do_on_loading_state_change;
  }

  constructor(
    readonly render_process_handler: PinoSubprocessRenderProcessHandler
  ) {
    this.init_native();
  }
}
