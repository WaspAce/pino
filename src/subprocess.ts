import { SP_INFO_INIT_SCRIPTS_INDEX } from './subprocess_types';
export class PinoSubprocess {
  private rph: RenderProcessHandler;
  private initial_scritps: string[] = [];

  private do_on_context_created(
    browser: Browser,
    frame: Frame,
    context: V8Context
  ) {
    this.initial_scritps.forEach(source => {
      frame.execute_java_script(
        source,
        'http://initial_scripts.wa',
        0
      );
    });
  }

  private define_initial_scripts(
    subprocess_info: ListValue
  ) {
    if (subprocess_info.size > SP_INFO_INIT_SCRIPTS_INDEX) {
      const scripts = subprocess_info.get_list(SP_INFO_INIT_SCRIPTS_INDEX);
      if (scripts.size > 0) {
        for (let i = 0; i < scripts.size; i++) {
          this.initial_scritps.push(scripts.get_string(i));
        }
      }
    }
  }

  private do_on_render_thread_created(
    subprocess_info: ListValue
  ) {
    this.define_initial_scripts(subprocess_info);
    // console.log('Render thread created: ', extra_info.get_string(0));
  }

  private create_render_process_handler() {
    this.rph = new RenderProcessHandler(this);
    this.rph.on_context_created = this.do_on_context_created;
    this.rph.on_render_thread_created = this.do_on_render_thread_created;
    // this.create_extension();
    // this.rph.v8_extension = this.extension;

    subprocess.render_process_handler = this.rph;
  }

  constructor() {
    this.create_render_process_handler();
    subprocess.start();
  }
}

const sub = new PinoSubprocess();
export { sub };
