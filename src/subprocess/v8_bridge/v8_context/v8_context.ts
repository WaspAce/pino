import { PinoSubprocess } from './../../subprocess';

const BRIDGE_SCRIPT_URL = 'http://bv8ridge.wa/';

const INITIALIZED_MARKER = 'scripts_initialized';

export class PinoV8Context {

  private has_document(
    global: V8Value
  ): boolean {
    return (global && global.has_value_by_key('document'));
  }

  private get_reflect(
    global: V8Value
  ): V8Value {
    if (global && global.has_value_by_key('Reflect')) {
      return global.get_value_by_key('Reflect');
    }
  }

  private has_jquery(
    global: V8Value
  ): boolean {
    return (global && global.has_value_by_key('jQuery'));
  }

  private was_initialized(
    global: V8Value
  ): boolean {
    let result = false;
    const reflect = this.get_reflect(global);
    if (reflect && reflect.has_value_by_key(INITIALIZED_MARKER)) {
      const value = reflect.get_value_by_key(INITIALIZED_MARKER);
      if (value.is_bool) {
        result = value.get_bool_value();
      }
    }
    return result;
  }

  private init_scripts(
    tries?: number
  ) {
    if (!tries) {
      tries = 0;
    }
    const global = this.global;
    const has_document = this.has_document(global);
    const initialized = (this.has_jquery(global) && this.was_initialized(global));
    if (!initialized && has_document) {
      this.subprocess.initial_scritps.forEach(script => {
        this.eval(script);
      });
      this.eval(`Reflect.${INITIALIZED_MARKER} = true;`);
      if (tries < 2) {
        this.init_scripts(tries + 1);
      }
    }
  }

  constructor(
    readonly native: V8Context,
    private readonly subprocess: PinoSubprocess
  ) {
    this.init_scripts();
  }

  eval(
    code: string
  ): V8ContextEvalResult {
    return this.native.eval(code, BRIDGE_SCRIPT_URL, 0);
  }

  get is_valid(): boolean {
    return this.native.is_valid;
  }

  get global(): V8Value {
    const result = this.native.get_global();
    return result;
  }
}
