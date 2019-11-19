import { PinoV8Value } from '../../../subprocess/v8_bridge/v8_value/v8_value';
import { PinoV8BridgeMessage, V8BridgeAction } from '../v8_bridge_message/v8_bridge_message';
import { PinoV8BridgeResponseResolver } from '../v8_bridge_response_resolver/v8_bridge_response_resolver';
import { PinoFrame } from '../../browser/frame/frame';
import { PinoV8ValueType } from '../../../subprocess/v8_bridge/v8_value/v8_value_type';
import { PinoV8Proxy } from '../v8_proxy/v8_proxy';
import { PinoElementRects } from '../../../element_rects/element_rects';

let last_message_id = 0;
const response_resolvers_by_id = new Map<number, PinoV8BridgeResponseResolver>();
export const V8BRIDGE_RESPONE_TIMEOUT_MS = 10000;

export class PinoV8BridgeBrowser {

  private main_process_message_from_sub(
    bridge_message: PinoV8BridgeMessage
  ) {
    const identifier = bridge_message.identifier;
    if (response_resolvers_by_id.has(identifier)) {
      const resolver = response_resolvers_by_id.get(identifier);
      response_resolvers_by_id.delete(identifier);
      resolver.process_message(bridge_message);
    }
  }

  private process_eval_result(
    response: PinoV8BridgeMessage,
    frame: PinoFrame
  ) {
    switch (response.action) {
      case V8BridgeAction.RENDERER_V8_REFERENCE:
        const value: PinoV8Value = JSON.parse(response.payload);
        if (value.value_type < PinoV8ValueType.UNDEFINED) {
          return value.value;
        } else if (value.value_type > PinoV8ValueType.UNDEFINED) {
          return new PinoV8Proxy(this, value.pool_id, frame).native;
        }
        break;
      default:
        break;
    }
  }

  constructor(
    readonly frame: Frame
  ) {
    if (system.is_subprocess) {
      throw new Error('PinoV8BridgeBrowser MUST be created in browser process');
    }
  }

  receive_message(
    message: ProcessMessage,
  ) {
    const bridge_message = new PinoV8BridgeMessage(message);
    this.main_process_message_from_sub(bridge_message);
  }

  async send_message(
    message: PinoV8BridgeMessage,
    timeout_ms: number
  ): Promise<PinoV8BridgeMessage> {
    return new Promise<PinoV8BridgeMessage>((resolve, reject) => {
      message.identifier = ++last_message_id;
      const resolver = new PinoV8BridgeResponseResolver(resolve, reject);
      if (this.frame.is_valid) {
        response_resolvers_by_id.set(message.identifier, resolver);
        this.frame.send_process_message(ProcessId.PID_RENDERER, message.native);
        if (timeout_ms > 0) {
          setTimeout(_ => {
            response_resolvers_by_id.delete(message.identifier);
            resolver.timed_out(message);
          }, timeout_ms);
        }
      } else {
        resolver.invalid_frame();
      }
    });
  }

  async eval(
    code: string,
    frame: PinoFrame
  ): Promise<any> {
    const request = new PinoV8BridgeMessage();
    request.action = V8BridgeAction.BROWSER_EXECUTE_CODE;
    request.payload = code;
    const response = await this.send_message(request, V8BRIDGE_RESPONE_TIMEOUT_MS);
    if (!response) {
      return undefined;
    }
    return this.process_eval_result(response, frame);
  }

  async eval_and_wait_data(
    code: string,
    frame: PinoFrame
  ): Promise<any> {
    const request = new PinoV8BridgeMessage();
    request.action = V8BridgeAction.BROWSER_EVAL_AND_WAIT_DATA;
    request.payload = code;
    const response = await this.send_message(request, 0);
    if (!response) {
      return undefined;
    }
    return this.process_eval_result(response, frame);
  }

  async get_frame_rects(): Promise<PinoElementRects> {
    const request = new PinoV8BridgeMessage();
    request.action = V8BridgeAction.BROWSER_GET_FRAME_RECTS;
    const response = await this.send_message(request, V8BRIDGE_RESPONE_TIMEOUT_MS);
    if (!response) {
      return undefined;
    }
    const rects = JSON.parse(response.payload);
    const result = new PinoElementRects();

    result.full.x = rects.full.x;
    result.full.y = rects.full.y;
    result.full.width = rects.full.width;
    result.full.height = rects.full.height;

    result.view.x = rects.view.x;
    result.view.y = rects.view.y;
    result.view.width = rects.view.width;
    result.view.height = rects.view.height;

    return result;
  }

  async get_element_rects(
    element_id: number
  ): Promise<PinoElementRects> {
    const request = new PinoV8BridgeMessage();
    request.action = V8BridgeAction.BROWSER_GET_ELEMENT_RECTS;
    request.payload = JSON.stringify(element_id);
    const response = await this.send_message(request, V8BRIDGE_RESPONE_TIMEOUT_MS);
    if (!response) {
      return undefined;
    }
    const rects = JSON.parse(response.payload);
    const result = new PinoElementRects();

    result.full.x = rects.full.x;
    result.full.y = rects.full.y;
    result.full.width = rects.full.width;
    result.full.height = rects.full.height;

    result.view.x = rects.view.x;
    result.view.y = rects.view.y;
    result.view.width = rects.view.width;
    result.view.height = rects.view.height;

    return result;
  }
}
