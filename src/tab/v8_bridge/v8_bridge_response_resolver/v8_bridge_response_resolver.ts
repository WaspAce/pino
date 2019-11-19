import { PinoV8Exception } from '../../../subprocess/v8_bridge/v8_exception';
import { PinoV8BridgeMessage, V8BridgeAction } from '../v8_bridge_message/v8_bridge_message';

declare type  PinoV8BridgeBridgeResolverResolve = (value: PinoV8BridgeMessage) => void;
declare type  PinoV8BridgeBridgeResolverReject = (reason: Error) => void;

export class PinoV8BridgeResponseResolver {

  private clear() {
    this.resolve_handler = undefined;
    this.reject_handler = undefined;
  }

  private resolve(
    value: PinoV8BridgeMessage
  ) {
    const handler = this.resolve_handler;
    this.clear();
    if (handler) {
      handler(value);
    }
  }

  private reject(
    reason: string
  ) {
    const handler = this.reject_handler;
    this.clear();
    if (handler) {
      handler(new Error(reason));
    }
  }

  constructor(
    private resolve_handler: PinoV8BridgeBridgeResolverResolve,
    private reject_handler: PinoV8BridgeBridgeResolverReject
  ) {}

  timed_out(
    request: PinoV8BridgeMessage
  ) {
    this.reject(`Bridge message timed out: ${request.identifier}`);
  }

  invalid_frame() {
    this.reject('Bridge message: invalid frame');
  }

  process_message(
    bridge_message: PinoV8BridgeMessage
  ) {
    if (bridge_message && bridge_message.action) {
      switch (bridge_message.action) {
        case V8BridgeAction.RENDERER_INVALID_CONTEXT:
          this.reject('Bridge message: Invalid context');
          break;
        case V8BridgeAction.RENDERER_UNDEFINED_ERROR:
          this.reject('Bridge message: Undefined error');
          break;
        case V8BridgeAction.RENDERER_V8_EXCEPTION:
          const exception: PinoV8Exception = JSON.parse(bridge_message.payload);
          this.reject(`V8 exception: ${exception.message}(line: ${exception.line_number})`);
          break;
        default:
          this.resolve(bridge_message)
          break;
      }
    } else {
      this.reject('Bridge message is undefined');
    }
  }
}
