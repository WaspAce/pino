import { PinoSubprocessV8Extension } from './../v8_extension';
export class PinoSubprocessV8Handler {

  native: V8Handler;

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

  constructor(
    private readonly v8_extension: PinoSubprocessV8Extension
  ) {
    this.native = new V8Handler(this);
    this.native.on_execute = this.on_execute_extension_func;
  }
}
