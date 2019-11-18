import { PinoV8Extension } from './../subprocess/render_process_handler/v8_extension/v8_extension';
import { PinoFrame } from './../tab/browser/frame/frame';
import { PinoV8GetPropertyOptions, PinoV8SetPropertyOptions, PinoV8CallMethodOptions } from './v8_payload_types';
import { PinoV8Proxy } from './v8_proxy/v8_proxy';
import { PinoV8Exception } from './v8_exception';
import { PinoV8context } from './v8_context/v8_context';
import { PinoV8Pool } from './v8_pool/v8_pool';
import { PinoV8BridgeMessage, V8BridgeAction } from './v8_bridge_message/v8_bridge_message';
import { get_v8_value_type, PinoV8ValueType } from './v8_value/v8_value_type';
import { PinoV8Value } from './v8_value/v8_value';

interface BridgeResponseResolver {
  resolve: (value: PinoV8BridgeMessage) => void;
}

let last_message_id = 0;
const response_resolvers_by_id = new Map<number, BridgeResponseResolver>();

export const V8BRIDGE_RESPONE_TIMEOUT_MS = 10000;

export class PinoV8Bridge {

  private context: PinoV8context;
  private pool: PinoV8Pool;

  private get_invalid_context_response(): PinoV8BridgeMessage {
    const result = new PinoV8BridgeMessage();
    result.action = V8BridgeAction.SUB_INVALID_CONTEXT;
    return result;
  }

  private get_value_response(
    value: V8Value,
    pool_id: number
  ): PinoV8BridgeMessage {
    const result = new PinoV8BridgeMessage();
    result.action = V8BridgeAction.SUB_V8_REFERENCE;
    const value_type = get_v8_value_type(value);
    const pino_value: PinoV8Value = {
      value_type
    };
    switch (value_type) {
      case PinoV8ValueType.ARRAY:
      case PinoV8ValueType.ARRAY_BUFFER:
      case PinoV8ValueType.DATE:
      case PinoV8ValueType.FUNCTION:
      case PinoV8ValueType.OBJECT:
        this.pool.set_value(value, pool_id);
        pino_value.pool_id = pool_id;
        break;
      case PinoV8ValueType.BOOLEAN:
        pino_value.value = value.get_bool_value();
        break;
      case PinoV8ValueType.DOUBLE:
        pino_value.value = value.get_double_value();
        break;
      case PinoV8ValueType.INTEGER:
          pino_value.value = value.get_int_value();
          break;
      case PinoV8ValueType.STRING:
          pino_value.value = value.get_string_value();
          break;
      case PinoV8ValueType.UINT:
          pino_value.value = value.get_uint_value();
          break;
      default:
        break;
    }
    result.payload = JSON.stringify(pino_value);
    return result;
  }

  private get_exception_response(
    exception: V8Exception
  ): PinoV8BridgeMessage {
    const result = new PinoV8BridgeMessage();
    result.action = V8BridgeAction.SUB_V8_EXCEPTION;
    const pino_exception: PinoV8Exception = {
      message: exception.get_message(),
      script_resource_name: exception.get_script_resource_name(),
      source_line: exception.get_source_line(),
      line_number: exception.get_line_number(),
      start_position: exception.get_start_position(),
      end_position: exception.get_end_position(),
      start_column: exception.get_start_column(),
      end_column: exception.get_end_column()
    };
    result.payload = JSON.stringify(pino_exception);
    return result;
  }

  private get_undefined_error_response(): PinoV8BridgeMessage {
    const result = new PinoV8BridgeMessage();
    result.action = V8BridgeAction.SUB_UNDEFINED_ERROR;
    return result;
  }

  private execute_code(
    code: string,
    message_id: number
  ): PinoV8BridgeMessage {
    if (!this.context.is_valid) {
      return this.get_invalid_context_response();
    }
    const eval_result = this.context.eval(`try{ ${code} } catch(e) {}`);
    if (eval_result.result) {
      return this.get_value_response(eval_result.ret_val, message_id);
    } else if (eval_result.exception) {
      return this.get_exception_response(eval_result.exception);
    } else {
      return this.get_undefined_error_response();
    }
  }

  private sub_process_execute_code(
    bridge_message: PinoV8BridgeMessage
  ) {
    const response = this.execute_code(bridge_message.payload, bridge_message.identifier);
    response.identifier = bridge_message.identifier;
    this.frame.send_process_message(ProcessId.PID_BROWSER, response.native);
  }

  private get_property(
    parent_id: number,
    property_name: string,
    message_id: number
  ): PinoV8BridgeMessage {
    if (!this.context.is_valid) {
      return this.get_invalid_context_response();
    }
    let prop: V8Value;
    const v8_obj = this.pool.get_value(parent_id);
    if (!v8_obj.is_valid || !v8_obj.is_object) {
      return this.get_invalid_context_response();
    } else {
      if (v8_obj.has_value_by_key(property_name)) {
        prop = v8_obj.get_value_by_key(property_name);
      } else {
        prop = this.context.native.create_undefined();
      }
    }
    return this.get_value_response(prop, message_id);
  }

  private sub_process_get_property(
    bridge_message: PinoV8BridgeMessage
  ) {
    const options: PinoV8GetPropertyOptions = JSON.parse(bridge_message.payload);
    const response = this.get_property(options.parent_id, options.property_name, bridge_message.identifier);
    response.identifier = bridge_message.identifier;
    this.frame.send_process_message(ProcessId.PID_BROWSER, response.native);
  }

  private set_property(
    parent_id: number,
    property_name: string,
    property_value: PinoV8Value
  ) {
    if (this.context.is_valid) {
      const v8_obj = this.pool.get_value(parent_id);
      if (!v8_obj.is_object || !v8_obj.is_valid) {
        return;
      }
      let v8_value: V8Value;
      switch (property_value.value_type) {
        case PinoV8ValueType.ARRAY:
        case PinoV8ValueType.ARRAY_BUFFER:
        case PinoV8ValueType.DATE:
        case PinoV8ValueType.FUNCTION:
        case PinoV8ValueType.OBJECT:
          v8_value = this.pool.get_value(property_value.pool_id);
          break;
        case PinoV8ValueType.BOOLEAN:
          v8_value = this.context.native.create_bool(property_value.value);
          break;
        case PinoV8ValueType.DOUBLE:
          v8_value = this.context.native.create_double(property_value.value);
          break;
        case PinoV8ValueType.INTEGER:
          v8_value = this.context.native.create_int(property_value.value);
          break;
        case PinoV8ValueType.STRING:
          v8_value = this.context.native.create_string(property_value.value);
          break;
        case PinoV8ValueType.UINT:
          v8_value = this.context.native.create_uint(property_value.value);
          break;
        case PinoV8ValueType.NULL:
          v8_value = this.context.native.create_null();
          break;
        default:
          v8_value = this.context.native.create_undefined();
          break;
      }
      v8_obj.set_value_by_key(property_name, v8_value);
    }
  }

  private sub_process_set_property(
    bridge_message: PinoV8BridgeMessage
  ) {
    const options: PinoV8SetPropertyOptions = JSON.parse(bridge_message.payload);
    this.set_property(options.parent_id, options.property_name, options.value);
  }

  private call_method(
    parent_id: number,
    method_name: string,
    message_id: number
  ): PinoV8BridgeMessage {
    if (!this.context.is_valid) {
      return this.get_invalid_context_response();
    }
    let result: V8Value;
    const v8_obj = this.pool.get_value(parent_id);
    if (!v8_obj.is_valid || !v8_obj.is_object) {
      return this.get_invalid_context_response();
    } else {
      if (v8_obj.has_value_by_key(method_name)) {
        const prop = v8_obj.get_value_by_key(method_name);
        if (prop.is_function) {
          const context = this.frame.get_v8_context();
          context.enter();
          result = prop.execute_function(v8_obj);
          context.exit();
        } else {
          result = this.context.native.create_undefined();
        }
      } else {
        result = this.context.native.create_undefined();
      }
    }
    return this.get_value_response(result, message_id);
  }

  private sub_process_call_method(
    bridge_message: PinoV8BridgeMessage
  ) {
    const options: PinoV8CallMethodOptions = JSON.parse(bridge_message.payload);
    const response = this.call_method(options.parent_id, options.method_name, bridge_message.identifier);
    response.identifier = bridge_message.identifier;
    this.frame.send_process_message(ProcessId.PID_BROWSER, response.native);
  }

  private async eval_code_and_wait_data(
    code: string,
    extension: PinoV8Extension,
    message_id: number
  ): Promise<PinoV8BridgeMessage> {
    return new Promise(resolve => {
      if (!this.context.is_valid) {
        resolve(this.get_invalid_context_response());
      }
      extension.wait_for_data(this.frame.identifier).then(value => {
        resolve(this.get_value_response(value, message_id));
      });
      const eval_result = this.context.eval(`try{ ${code} } catch(e) {}`);
      if (eval_result.result) {
        // 
      } else if (eval_result.exception) {
        resolve(this.get_exception_response(eval_result.exception));
      } else {
        resolve(this.get_undefined_error_response());
      }
    });
  }

  private async sub_process_eval_and_wait_data(
    bridge_message: PinoV8BridgeMessage,
    extension: PinoV8Extension
  ) {
    const response = await this.eval_code_and_wait_data(bridge_message.payload, extension, bridge_message.identifier);
    response.identifier = bridge_message.identifier;
    this.frame.send_process_message(ProcessId.PID_BROWSER, response.native);
  }

  private sub_process_message_from_main(
    bridge_message: PinoV8BridgeMessage,
    extension: PinoV8Extension
  ) {
    switch (bridge_message.action) {
      case V8BridgeAction.MAIN_EXECUTE_CODE:
        this.sub_process_execute_code(bridge_message);
        break;
      case V8BridgeAction.MAIN_GET_PROPERTY:
        this.sub_process_get_property(bridge_message);
        break;
      case V8BridgeAction.MAIN_SET_PROPERTY:
        this.sub_process_set_property(bridge_message);
        break;
      case V8BridgeAction.MAIN_CALL_METHOD:
        this.sub_process_call_method(bridge_message);
        break;
      case V8BridgeAction.MAIN_EVAL_AND_WAIT_DATA:
        this.sub_process_eval_and_wait_data(bridge_message, extension);
        break;
      default:
        break;
    }
  }

  private main_process_sub_response(
    bridge_message: PinoV8BridgeMessage
  ) {
    const identifier = bridge_message.identifier;
    if (response_resolvers_by_id.has(identifier)) {
      const resolver = response_resolvers_by_id.get(identifier);
      response_resolvers_by_id.delete(identifier);
      this.resolve_response(resolver, bridge_message);
    }
  }

  private main_process_message_from_sub(
    bridge_message: PinoV8BridgeMessage
  ) {
    switch (bridge_message.action) {
      case V8BridgeAction.SUB_INVALID_CONTEXT:
        throw new Error('Invalid V8 context');
      default:
        this.main_process_sub_response(bridge_message);
        break;
    }
  }

  private resolve_response(
    resolver: BridgeResponseResolver,
    response?: PinoV8BridgeMessage
  ) {
    if (resolver && resolver.resolve) {
      const resolve = resolver.resolve;
      resolver.resolve = undefined;
      resolve(response);
    }
  }

  private process_eval_result(
    response: PinoV8BridgeMessage,
    frame: PinoFrame
  ) {
    switch (response.action) {
      case V8BridgeAction.SUB_UNDEFINED_ERROR:
        throw new Error('Undefined error');
      case V8BridgeAction.SUB_V8_EXCEPTION:
        const exception: PinoV8Exception = JSON.parse(response.payload);
        throw new Error(`V8 exception: ${exception.message}(line: ${exception.line_number})`);
      case V8BridgeAction.SUB_V8_REFERENCE:
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
      this.context = new PinoV8context(this.frame.get_v8_context());
      this.pool = new PinoV8Pool(this.context);
    }
  }

  async send_message(
    message: PinoV8BridgeMessage,
    timeout_ms: number
  ): Promise<PinoV8BridgeMessage> {
    return new Promise<PinoV8BridgeMessage>(resolve => {
      message.identifier = ++last_message_id;
      const resolver: BridgeResponseResolver = {
        resolve
      };
      response_resolvers_by_id.set(last_message_id, resolver);
      this.frame.send_process_message(ProcessId.PID_RENDERER, message.native);
      if (timeout_ms > 0) {
        setTimeout(_ => {
          this.resolve_response(resolver);
        }, timeout_ms);
      }
    });
  }

  receive_message(
    message: ProcessMessage,
    extension?: PinoV8Extension
  ) {
    const bridge_message = new PinoV8BridgeMessage(message);
    if (bridge_message.action < V8BridgeAction.NOT_SET) {
      this.sub_process_message_from_main(bridge_message, extension);
    } else if (bridge_message.action > V8BridgeAction.NOT_SET) {
      this.main_process_message_from_sub(bridge_message);
    }
  }

  async eval(
    code: string,
    frame: PinoFrame
  ): Promise<any> {
    const request = new PinoV8BridgeMessage();
    request.action = V8BridgeAction.MAIN_EXECUTE_CODE;
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
    request.action = V8BridgeAction.MAIN_EVAL_AND_WAIT_DATA;
    request.payload = code;
    const response = await this.send_message(request, 0);
    if (!response) {
      return undefined;
    }
    return this.process_eval_result(response, frame);
  }

  context_released(
    frame_id: number
  ) {
    const request = new PinoV8BridgeMessage();
    request.action = V8BridgeAction.SUB_CONTEXT_RELEASED;
    request.payload = JSON.stringify(frame_id);
    this.send_message(request, V8BRIDGE_RESPONE_TIMEOUT_MS);
  }
}
