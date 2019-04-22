class Sub {
    v8_value_to_list(value, list, index) {
        if (value.is_bool) {
            list.set_bool(index, value.get_bool_value());
        }
        else if (value.is_double) {
            list.set_double(index, value.get_double_value());
        }
        else if (value.is_int || value.is_uint) {
            list.set_int(index, value.get_int_value());
        }
        else if (value.is_string) {
            list.set_string(index, value.get_string_value());
        }
        else if (value.is_array) {
            const array_length = value.get_array_length();
            const new_list = new ListValue();
            new_list.set_size(array_length);
            for (let i = 0; i < array_length; i++) {
                this.v8_value_to_list(value.get_value_by_index(i), new_list, i);
            }
            list.set_list(index, new_list);
        }
    }
    on_execute_extension_func(context, name, object, args) {
        const message = new ProcessMessage(name);
        const list = message.get_argument_list();
        list.set_size(args.length);
        args.forEach((arg, index) => {
            this.v8_value_to_list(arg, list, index);
        });
        context.get_browser().send_process_message(ProcessId.PID_BROWSER, message);
    }
    create_extension_handler() {
        this.ext_handler = new V8Handler(this);
        this.ext_handler.on_execute = this.on_execute_extension_func;
    }
    do_on_context_created(browser, frame, context) {
        if (frame.is_main) {
            frame.execute_java_script('document.addEventListener("DOMContentLoaded", function() {dom_ready()});', 'http://wascript.wa', 0);
        }
    }
    create_extension() {
        this.extension = new V8Extension();
        this.extension.name = 'mini extension';
        this.extension.code = `
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
        this.create_extension();
        this.rph.v8_extension = this.extension;
        subprocess.render_process_handler = this.rph;
        subprocess.start();
    }
}
const sub = new Sub();
export default sub;
