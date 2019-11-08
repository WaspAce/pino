import { PinoSubprocessRenderProcessHandler } from './../render_process_handler';
import { PinoSubprocessV8Handler } from './v8_handler/v8_handler';

export const IPC_TRANSFER_DATA_FUN_NAME = 'transfer_data';
export const IPC_EXCEPTION_FUN_NAME = 'js_exception';

export class PinoV8Extension {

  native: V8Extension;

  private handler: PinoSubprocessV8Handler;

  private init_native() {
    this.native = new V8Extension();
    this.native.name = 'ale v8 extension';
    this.native.code  = `
      var ${IPC_TRANSFER_DATA_FUN_NAME} = function() {
        native function ${IPC_TRANSFER_DATA_FUN_NAME}();
        return ${IPC_TRANSFER_DATA_FUN_NAME}(...arguments);
      };
      var ${IPC_EXCEPTION_FUN_NAME} = function(e) {
        native function ${IPC_EXCEPTION_FUN_NAME}();
        return ${IPC_EXCEPTION_FUN_NAME}(e.message);
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

  async wait_for_data(
    frame_id: number
  ): Promise<V8Value> {
    return this.handler.wait_for_data(frame_id);
  }
}
