class Sub {
  private rph: RenderProcessHandler;
  private extension: V8Extension;
  private ext_handler: V8Handler;

  // private do_on_web_kit_initialized() {
  //   // console.log('SUBPROCESS:\t', 'webkit initialized');
  // }

  // private do_on_process_message_received (
  //     browser: Browser,
  //     source_process: ProcessId,
  //     message: ProcessMessage
  // ): boolean {
  //   return true;
  // }

  // private do_on_browser_created(
  //     browser: Browser
  // ) {
  //     // console.log('SUBPROCESS:\t', 'browser created');
  // }

  // private do_on_render_thread_created(
  //     extra_info: ListValue
  // ) {
  //     // console.log('SUBPROCESS:\t', 'render thread created: ', extra_info.get_string(0));
  // }

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
    context.get_browser().send_process_message(ProcessId.PID_BROWSER, message);
  }

  private create_extension_handler() {
      this.ext_handler = new V8Handler(this);
      this.ext_handler.on_execute = this.on_execute_extension_func;
  }

  private do_on_context_created(
      browser: Browser,
      frame: Frame,
      context: V8Context
  ) {
      if (frame.is_main) {
        frame.execute_java_script(
          'document.addEventListener("DOMContentLoaded", function() {dom_ready()});',
          'http://wascript.wa',
          0
        );
      }
      // console.log('SUBPROCESS:\t', 'context created: ');
  }

  private create_extension() {
      this.extension = new V8Extension();
      this.extension.name = 'mini extension';
      this.extension.code  = `
        var transfer_data = function() {
          native function transfer_data();
          return transfer_data(...arguments);
        };
        var dom_ready = function() {
          native function dom_ready();
          return dom_ready();
        };
      `;
      this.create_extension_handler();
      this.extension.handler = this.ext_handler;
  }

  constructor() {
      this.rph = new RenderProcessHandler(this);
      this.rph.on_context_created = this.do_on_context_created;
      // this.rph.on_web_kit_initialized = this.do_on_web_kit_initialized;
      // this.rph.on_process_message_received = this.do_on_process_message_received;
      // this.rph.on_browser_created = this.do_on_browser_created;
      // this.rph.on_render_thread_created = this.do_on_render_thread_created;
      this.create_extension();
      this.rph.v8_extension = this.extension;

      subprocess.render_process_handler = this.rph;
      subprocess.start();
  }
}

const sub = new Sub();
export default sub;
