import { SP_INFO_INIT_SCRIPTS_INDEX } from './../../app/app';
import { IPC_V8_BRIDGE_MSG } from './../../v8_bridge/v8_bridge_message/v8_bridge_message';
import { PinoSubprocessLoadHandler } from './load_handler/load_handler';
import { PinoSubprocess } from '../subprocess';
import { PinoV8Bridge } from '../../v8_bridge/v8_bridge';

export class PinoSubprocessRenderProcessHandler {

  native: RenderProcessHandler;

  private load_handler: PinoSubprocessLoadHandler;
  private default_scripts = [
    loader.load_from_file('assets://jquery.min.js'),
    loader.load_from_file('assets://utils.js')
  ];

  private define_initial_scripts(
    subprocess_info: ListValue
  ) {
    if (subprocess_info.size > SP_INFO_INIT_SCRIPTS_INDEX) {
      const scripts = subprocess_info.get_list(SP_INFO_INIT_SCRIPTS_INDEX);
      if (scripts.size > 0) {
        for (let i = 0; i < scripts.size; i++) {
          this.subprocess.initial_scritps.push(scripts.get_string(i));
        }
      }
    }
    this.subprocess.initial_scritps = this.default_scripts.concat(this.subprocess.initial_scritps);
  }

  private do_on_render_thread_created(
    subprocess_info: ListValue
  ) {
    this.define_initial_scripts(subprocess_info);
  }

  private do_on_process_message_received(
    browser: Browser,
    frame: Frame,
    source_process: ProcessId,
    message: ProcessMessage
  ): boolean {
    if (message.name === IPC_V8_BRIDGE_MSG) {
      const bridge = new PinoV8Bridge(frame);
      bridge.receive_message(message);
    }
    return true;
  }

  private init_native() {
    this.native = new RenderProcessHandler(this);
    this.native.on_render_thread_created = this.do_on_render_thread_created;
    this.native.on_process_message_received = this.do_on_process_message_received;
  }

  private create_load_handler() {
    this.load_handler = new PinoSubprocessLoadHandler(this);
    this.native.load_handler = this.load_handler.native;
  }

  constructor(
    readonly subprocess: PinoSubprocess
  ) {
    this.init_native();
    this.create_load_handler();
  }
}
