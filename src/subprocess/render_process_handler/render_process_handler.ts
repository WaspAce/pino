import { PinoSubprocessLoadHandler } from './../load_handler/load_handler';
import { PinoSubprocessV8Extension } from './v8_extension/v8_extension';
import { SP_INFO_INIT_SCRIPTS_INDEX } from './../subprocess_types';
import { PinoSubprocess } from '../subprocess';

export class PinoSubprocessRenderProcessHandler {

  native: RenderProcessHandler;

  private extension: PinoSubprocessV8Extension;
  private load_handler: PinoSubprocessLoadHandler;

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
  }

  private do_on_render_thread_created(
    subprocess_info: ListValue
  ) {
    this.define_initial_scripts(subprocess_info);
  }

  private create_extension() {
    this.extension = new PinoSubprocessV8Extension(this);
  }

  private init_native() {
    this.native = new RenderProcessHandler(this);
    this.native.on_render_thread_created = this.do_on_render_thread_created;
    this.native.v8_extension = this.extension.native;
  }

  private create_load_handler() {
    this.load_handler = new PinoSubprocessLoadHandler(this);
    this.native.load_handler = this.load_handler.native;
  }

  constructor(
    readonly subprocess: PinoSubprocess
  ) {
    this.create_extension();
    this.init_native();
    this.create_load_handler();
  }
}
