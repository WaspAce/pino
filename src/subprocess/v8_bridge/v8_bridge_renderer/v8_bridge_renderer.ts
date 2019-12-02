import { PinoSubprocess } from './../../subprocess';
import { PinoElementRects } from '../../../element_rects/element_rects';
import { PinoV8GetPropertyOptions, PinoV8SetPropertyOptions, PinoV8CallMethodOptions } from '../../../tab/v8_bridge/v8_payload_types';
import { PinoV8Exception } from '../v8_exception';
import { PinoV8Context } from '../v8_context/v8_context';
import { PinoV8Pool, V8POOl_NAME } from '../v8_pool/v8_pool';
import { PinoV8BridgeMessage, V8BridgeAction } from '../../../tab/v8_bridge/v8_bridge_message/v8_bridge_message';
import { get_v8_value_type, PinoV8ValueType } from '../v8_value/v8_value_type';
import { PinoV8Value } from '../v8_value/v8_value';
import { PinoV8Extension } from '../../render_process_handler/v8_extension/v8_extension';

export class PinoV8BridgeRenderer {

  private context: PinoV8Context;
  private pool: PinoV8Pool;

  private get_invalid_context_response(): PinoV8BridgeMessage {
    const result = new PinoV8BridgeMessage();
    result.action = V8BridgeAction.RENDERER_INVALID_CONTEXT;
    return result;
  }

  private get_value_response(
    value: V8Value,
    pool_id: number
  ): PinoV8BridgeMessage {
    const result = new PinoV8BridgeMessage();
    result.action = V8BridgeAction.RENDERER_V8_REFERENCE;
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
    result.action = V8BridgeAction.RENDERER_V8_EXCEPTION;
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
    result.action = V8BridgeAction.RENDERER_UNDEFINED_ERROR;
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

  private async eval_code_and_wait_data(
    code: string,
    extension: PinoV8Extension,
    message_id: number
  ): Promise<PinoV8BridgeMessage> {
    return new Promise<PinoV8BridgeMessage>(resolve => {
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

  private get_frame_rect(
    frame: Frame,
    rects: Rect[]
  ): PinoV8BridgeMessage {
    let eval_result: V8ContextEvalResult;
    let result: PinoV8BridgeMessage;
    if (frame.is_main) {
      const context = new PinoV8Context(frame.get_v8_context(), this.subprocess);
      if (!context.is_valid) {
        return this.get_invalid_context_response();
      }
      eval_result = context.eval(`Reflect.get_window_size()`);
    } else {
      result = this.get_frame_rect(frame.get_parent(), rects);
      const context = new PinoV8Context(frame.get_parent().get_v8_context(), this.subprocess);
      if (!context.is_valid) {
        result = this.get_invalid_context_response();
      }
      eval_result = context.eval(`Reflect.get_child_frame_rect(
        ${JSON.stringify(frame.url)}
      )`);
    }
    if (eval_result.exception) {
      result = this.get_exception_response(eval_result.exception);
    } else if (eval_result.result) {
      const sizes = JSON.parse(eval_result.ret_val.get_string_value());
      const x = sizes.x ? sizes.x : 0;
      const y = sizes.y ? sizes.y : 0;
      rects.push(new Rect(x, y, sizes.width, sizes.height));
    } else {
      result = this.get_undefined_error_response();
    }
    return result;
  }

  private get_frame_rects(): {
    error: PinoV8BridgeMessage,
    rects: PinoElementRects
  } {
    const frame_rects: Rect[] = [];
    const result = {
      error: this.get_frame_rect(this.frame, frame_rects),
      rects: new PinoElementRects()
    };
    frame_rects.forEach((rect, index) => {
      result.rects.full.x += rect.x;
      result.rects.full.y += rect.y;
      result.rects.full.width = rect.width;
      result.rects.full.height = rect.height;

      if (index === 0) {
        result.rects.view.x = rect.x;
        result.rects.view.y = rect.y;
        result.rects.view.width = rect.width;
        result.rects.view.height = rect.height;
      } else {
        const view_right = Math.min(result.rects.full.right, result.rects.view.right);
        const view_bottom = Math.min(result.rects.full.bottom, result.rects.view.bottom);
        result.rects.view.x = Math.max(result.rects.full.x, result.rects.view.x);
        result.rects.view.y = Math.max(result.rects.full.y, result.rects.view.y);
        result.rects.view.right = view_right;
        result.rects.view.bottom = view_bottom;
        if (result.rects.view.width < 0 || result.rects.view.height < 0) {
          result.rects.view.width = 0;
          result.rects.view.height = 0;
        }
      }
    });
    return result;
  }

  private async process_get_frame_rects(
    bridge_message: PinoV8BridgeMessage
  ): Promise<PinoV8BridgeMessage> {
    const result = this.get_frame_rects();
    let response: PinoV8BridgeMessage;
    if (result.error) {
      response = result.error;
    } else {
      response = new PinoV8BridgeMessage();
      response.action = V8BridgeAction.RENDERER_ELEMENT_RECTS;
      response.identifier = bridge_message.identifier;
      response.payload = JSON.stringify({
        full: {
          x: result.rects.full.x,
          y: result.rects.full.y,
          width: result.rects.full.width,
          height: result.rects.full.height
        },
        view: {
          x: result.rects.view.x,
          y: result.rects.view.y,
          width: result.rects.view.width,
          height: result.rects.view.height
        }
      });
    }
    return response;
  }

  private get_element_rect(
    element_id: number
  ): {
    rect: Rect,
    error?: PinoV8BridgeMessage
  } {
    let eval_result: V8ContextEvalResult;
    const result = {
      rect: undefined,
      error: undefined
    };
    if (!this.context.is_valid) {
      result.error = this.get_invalid_context_response();
    }
    eval_result = this.context.eval(`(() => {
      const element = Reflect.${V8POOl_NAME}[${element_id}];
      return JSON.stringify(Reflect.get_element_rect(element));
    })();`);
    if (eval_result.exception) {
      result.error = this.get_exception_response(eval_result.exception);
    } else if (eval_result.result) {
      const sizes = JSON.parse(eval_result.ret_val.get_string_value());
      result.rect = new Rect(sizes.x, sizes.y, sizes.width, sizes.height);
    } else {
      result.error = this.get_undefined_error_response();
    }
    return result;
  }

  private get_element_rects(
    element_id: number
  ): {
    error: PinoV8BridgeMessage,
    rects: PinoElementRects
  } {
    const result = this.get_frame_rects();
    if (!result.error) {
      const frame_rects = result.rects;
      const element_rect_result = this.get_element_rect(element_id);
      if (!element_rect_result.error) {
        result.rects = new PinoElementRects();
        result.rects.full.x = frame_rects.full.x + element_rect_result.rect.x;
        result.rects.full.y = frame_rects.full.y + element_rect_result.rect.y;
        result.rects.full.width = element_rect_result.rect.width;
        result.rects.full.height = element_rect_result.rect.height;

        const view_right = Math.min(result.rects.full.right, result.rects.full.x + element_rect_result.rect.right, frame_rects.view.right);
        const view_bottom = Math.min(result.rects.full.bottom, result.rects.full.x + element_rect_result.rect.bottom, frame_rects.view.bottom);
        result.rects.view.x = Math.max(result.rects.full.x, result.rects.view.x);
        result.rects.view.y = Math.max(result.rects.full.y, result.rects.view.y);
        result.rects.view.right = view_right;
        result.rects.view.bottom = view_bottom;
        if (result.rects.view.width < 0 || result.rects.view.height < 0) {
          result.rects.view.width = 0;
          result.rects.view.height = 0;
        }
      } else {
        result.error = element_rect_result.error;
      }
    }
    return result;
  }

  private async process_get_element_rects(
    bridge_message: PinoV8BridgeMessage
  ): Promise<PinoV8BridgeMessage> {
    const result = this.get_element_rects(JSON.parse(bridge_message.payload));
    let response: PinoV8BridgeMessage;
    if (result.error) {
      response = result.error;
    } else {
      response = new PinoV8BridgeMessage();
      response.action = V8BridgeAction.RENDERER_ELEMENT_RECTS;
      response.identifier = bridge_message.identifier;
      response.payload = JSON.stringify({
        full: {
          x: result.rects.full.x,
          y: result.rects.full.y,
          width: result.rects.full.width,
          height: result.rects.full.height
        },
        view: {
          x: result.rects.view.x,
          y: result.rects.view.y,
          width: result.rects.view.width,
          height: result.rects.view.height
        }
      });
    }
    return response;
  }

  private async process_message_from_browser(
    bridge_message: PinoV8BridgeMessage,
    extension: PinoV8Extension
  ) {
    let response: PinoV8BridgeMessage;
    switch (bridge_message.action) {
      case V8BridgeAction.BROWSER_EXECUTE_CODE:
        response = this.execute_code(bridge_message.payload, bridge_message.identifier);
        break;
      case V8BridgeAction.BROWSER_GET_PROPERTY:
        const get_property_options: PinoV8GetPropertyOptions = JSON.parse(bridge_message.payload);
        response = this.get_property(get_property_options.parent_id, get_property_options.property_name, bridge_message.identifier);
        break;
      case V8BridgeAction.BROWSER_SET_PROPERTY:
        const set_property_options: PinoV8SetPropertyOptions = JSON.parse(bridge_message.payload);
        this.set_property(set_property_options.parent_id, set_property_options.property_name, set_property_options.value);
        break;
      case V8BridgeAction.BROWSER_CALL_METHOD:
        const call_method_options: PinoV8CallMethodOptions = JSON.parse(bridge_message.payload);
        response = this.call_method(call_method_options.parent_id, call_method_options.method_name, bridge_message.identifier);
        break;
      case V8BridgeAction.BROWSER_EVAL_AND_WAIT_DATA:
        response = await this.eval_code_and_wait_data(bridge_message.payload, extension, bridge_message.identifier);
        break;
      case V8BridgeAction.BROWSER_GET_FRAME_RECTS:
        response = await this.process_get_frame_rects(bridge_message);
        break;
      case V8BridgeAction.BROWSER_GET_ELEMENT_RECTS:
        response = await this.process_get_element_rects(bridge_message);
        break;
      default:
        break;
    }
    if (response) {
      response.identifier = bridge_message.identifier;
      this.frame.send_process_message(ProcessId.PID_BROWSER, response.native);
    }
  }

  constructor(
    private readonly frame: Frame,
    private readonly subprocess: PinoSubprocess,
    bridge_message: PinoV8BridgeMessage,
    private readonly extension: PinoV8Extension
  ) {
    if (!system.is_subprocess) {
      throw new Error('PinoV8BridgeRenderer MUST be created in renderer process');
    }
    if (this.frame && this.frame.is_valid) {
      this.context = new PinoV8Context(this.frame.get_v8_context(), this.subprocess);
      this.pool = new PinoV8Pool(this.context);
      this.process_message_from_browser(bridge_message, this.extension);
    }
  }
}
