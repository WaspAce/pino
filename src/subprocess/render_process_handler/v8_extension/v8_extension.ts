import { PinoSubprocessRenderProcessHandler } from './../render_process_handler';
import { PinoSubprocessV8Handler } from './v8_handler/v8_handler';

export class PinoSubprocessV8Extension {

  native: V8Extension;

  private handler: PinoSubprocessV8Handler;

  private init_native() {
    this.native = new V8Extension();
    this.native.name = 'ale v8 extension';
    this.native.code  = `
      var transfer_data = function() {
        native function transfer_data();
        return transfer_data(...arguments);
      };
      var js_exception = function(e) {
        native function js_exception();
        return js_exception(e.message);
      };
    `;
    this.native.handler = this.handler.native;
  }

  private create_handler() {
    this.handler = new PinoSubprocessV8Handler(this);
  }

  constructor(
    private readonly render_process_handler: PinoSubprocessRenderProcessHandler
  ) {
    this.create_handler();
    this.init_native();
  }
}
