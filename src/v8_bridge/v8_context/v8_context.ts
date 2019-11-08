
const BRIDGE_SCRIPT_URL = 'http://bv8ridge.wa/';

export class PinoV8context {
  constructor(
    readonly native: V8Context
  ) {}

  eval(
    code: string
  ): V8ContextEvalResult {
    return this.native.eval(code, BRIDGE_SCRIPT_URL, 0);
  }

  get is_valid(): boolean {
    return this.native.is_valid;
  }

  get global(): V8Value {
    return this.native.get_global();
  }
}
