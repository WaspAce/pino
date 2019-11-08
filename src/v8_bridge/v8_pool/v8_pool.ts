import { PinoV8context } from './../v8_context/v8_context';

export const V8POOl_NAME = 'v8_pool';

export class PinoV8Pool {
  private pool_value: V8Value;

  private init_pool() {
    this.context.eval(
      `if (!Reflect.${V8POOl_NAME}) {
        Reflect.${V8POOl_NAME} = [];
      }`
    );
  }

  private define_pool_value() {
    const global = this.context.global;
    if (global.has_value_by_key('Reflect')) {
      const reflect = global.get_value_by_key('Reflect');
      if (reflect.has_value_by_key(V8POOl_NAME)) {
        this.pool_value = reflect.get_value_by_key(V8POOl_NAME);
      }
    }
  }

  constructor(
    private readonly context: PinoV8context
  ) {
    this.init_pool();
    this.define_pool_value();
  }

  set_value(
    value: V8Value,
    identifier: number
  ) {
    this.pool_value.set_value_by_index(identifier, value);
  }

  get_value(
    identifier: number
  ): V8Value {
    if (this.pool_value.has_value_by_index(identifier)) {
      return this.pool_value.get_value_by_index(identifier);
    } else {
      return this.context.native.create_undefined();
    }
  }
}
