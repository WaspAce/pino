import { SP_INFO_INIT_SCRIPTS_INDEX } from './subprocess_types';
export class PinoSubprocess {
  private rph: RenderProcessHandler;
  private initial_scritps: string[] = [];
  private extension: V8Extension;
  private extension_handler: V8Handler;
  private load_handler: LoadHandler;

  private execute_initial_scripts(
    frame: Frame
  ) {
    this.initial_scritps.forEach(source => {
      frame.execute_java_script(
        source,
        'http://initial_scripts.wa',
        0
      );
    });
  }

  private do_on_context_created(
    browser: Browser,
    frame: Frame,
    context: V8Context
  ) {
    this.execute_initial_scripts(frame);
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
   }

  private v8_value_to_list(
    value: V8Value,
    list: ListValue,
    index: number
  ) {
    if (value.is_bool) {
      list.set_bool(index, value.get_bool_value());
    } else if (value.is_double) {
      list.set_double(index, value.get_double_value());
    } else if (value.is_int || value.is_uint) {
      list.set_int(index, value.get_int_value());
    } else if (value.is_string) {
      list.set_string(index, value.get_string_value());
    } else if (value.is_array) {
      const array_length = value.get_array_length();
      const new_list = new ListValue();
      new_list.set_size(array_length);
      for (let i = 0; i < array_length; i++) {
        this.v8_value_to_list(value.get_value_by_index(i), new_list, i);
      }
      list.set_list(index, new_list);
    }
  }

  private on_execute_extension_func(
      context: V8Context,
      name: string,
      object: V8Value,
      args: V8Value[]
  ): void {
    const message = new ProcessMessage(name);
    const list = message.get_argument_list();
    list.set_size(args.length);
    args.forEach((arg, index) => {
      this.v8_value_to_list(arg, list, index);
    });
    if (context) {
      const browser = context.get_browser();
      if (browser) {
        browser.send_process_message(ProcessId.PID_BROWSER, message);
      }
    }
  }

  private create_extension_handler() {
    this.extension_handler = new V8Handler(this);
    this.extension_handler.on_execute = this.on_execute_extension_func;
}

  private create_extension() {
    this.extension = new V8Extension();
    this.extension.name = 'ale extension';
    this.extension.code  = `
      var transfer_data = function() {
        native function transfer_data();
        return transfer_data(...arguments);
      };
      var js_exception = function(e) {
        native function js_exception();
        return js_exception(e.message);
      };
    `;
    this.create_extension_handler();
    this.extension.handler = this.extension_handler;
}

  private create_render_process_handler() {
    this.rph = new RenderProcessHandler(this);
    this.rph.on_context_created = this.do_on_context_created;
    this.rph.on_render_thread_created = this.do_on_render_thread_created;
    this.create_extension();
    this.rph.v8_extension = this.extension;
    subprocess.render_process_handler = this.rph;
  }

  private do_on_load_end(
    browser: Browser,
    frame: Frame,
    http_status_code: number
  ) {
    this.execute_initial_scripts(frame);
  };

  private do_on_loading_state_change(
    browser: Browser,
    is_loading: boolean,
    can_go_back: boolean,
    can_go_forward: boolean
  ) {
    if (!is_loading) {
      const frame_ids = browser.get_frame_identifiers();
      frame_ids.forEach(id => {
        const frame = browser.get_frame_by_identifier(id);
        this.execute_initial_scripts(frame);
      });
      this.execute_initial_scripts(browser.get_main_frame());
    }
  }

  private create_load_handler() {
    this.load_handler = new LoadHandler(this);
    this.load_handler.on_load_end = this.do_on_load_end;
    this.load_handler.on_loading_state_change = this.do_on_loading_state_change;
    this.rph.load_handler = this.load_handler;
  }

  constructor() {
    this.create_render_process_handler();
    this.create_load_handler();
    subprocess.start();
  }
}

const sub = new PinoSubprocess();
export { sub };
