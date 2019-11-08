import { PinoV8Extension, IPC_TRANSFER_DATA_FUN_NAME } from './../v8_extension';

type FrameDataWaiter = (value: V8Value) => void;

export class PinoSubprocessV8Handler {

  native: V8Handler;

  private waiters = new Map<number, FrameDataWaiter>();

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
    if (name === IPC_TRANSFER_DATA_FUN_NAME) {
      const frame_id = context.get_frame().identifier;
      if (this.waiters.has(frame_id)) {
        const waiter = this.waiters.get(frame_id);
        this.waiters.delete(frame_id);
        if (args.length > 0) {
          waiter(args[0]);
        } else {
          waiter(context.create_undefined());
        }
      }
    }
  }

  constructor(
    private readonly v8_extension: PinoV8Extension
  ) {
    this.native = new V8Handler(this);
    this.native.on_execute = this.on_execute_extension_func;
  }

  async wait_for_data(
    frame_id: number
  ): Promise<V8Value> {
    return new Promise<V8Value>(resolve => {
      this.waiters.set(frame_id, resolve);
    });
  }
}
