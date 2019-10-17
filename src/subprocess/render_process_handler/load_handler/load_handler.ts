import { IPC_PAGE_LOADED } from '../../subprocess_types';
import { PinoSubprocessRenderProcessHandler } from '../render_process_handler';

export class PinoSubprocessLoadHandler {

  native: LoadHandler;

  private execute_initial_scripts(
    frame: Frame
  ) {
    if (frame) {
      this.render_process_handler.subprocess.initial_scritps.forEach(source => {
        frame.execute_java_script(
          source,
          'http://initial_scripts.wa',
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
      const frame_ids = browser.get_frame_identifiers();
      frame_ids.forEach(id => {
        this.execute_initial_scripts(browser.get_frame_by_identifier(id));
      });
      this.execute_initial_scripts(browser.get_main_frame());
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
