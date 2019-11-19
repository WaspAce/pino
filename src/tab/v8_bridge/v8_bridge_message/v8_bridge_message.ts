export const IPC_V8_BRIDGE_MSG = 'v8_bridge_message';

export enum V8BridgeAction {
  BROWSER_EXECUTE_CODE,
  BROWSER_GET_PROPERTY,
  BROWSER_SET_PROPERTY,
  BROWSER_CALL_METHOD,
  BROWSER_EVAL_AND_WAIT_DATA,
  BROWSER_GET_FRAME_RECTS,
  BROWSER_GET_ELEMENT_RECTS,

  NOT_SET,

  RENDERER_INVALID_CONTEXT,
  RENDERER_UNDEFINED_ERROR,
  RENDERER_V8_EXCEPTION,
  RENDERER_V8_REFERENCE,
  RENDERER_CONTEXT_RELEASED,
  RENDERER_ELEMENT_RECTS
}

const BRIDGE_MSG_IDX_ID = 0;
const BRIDGE_MSG_IDX_ACTION = 1;
const BRIDGE_MSG_IDX_PAYLOAD = 2;

export class PinoV8BridgeMessage {

  private args: ListValue;

  constructor(
    public readonly native?: ProcessMessage
  ) {
    if (this.native) {
      this.args = this.native.get_argument_list();
    } else {
      this.native = new ProcessMessage(IPC_V8_BRIDGE_MSG);
      this.args = this.native.get_argument_list();
      this.identifier = 0;
    }
  }

  get identifier(): number {
    let result = 0;
    if (this.args.size > BRIDGE_MSG_IDX_ID) {
      const value = this.args.get_value(BRIDGE_MSG_IDX_ID);
      if (value.value_type === ValueType.VTYPE_INT) {
        result = value.int;
      }
    }
    return result;
  }

  set identifier(
    value: number
  ) {
    if (this.args.size < BRIDGE_MSG_IDX_ID + 1) {
      this.args.set_size(BRIDGE_MSG_IDX_ID + 1);
    }
    this.args.set_int(BRIDGE_MSG_IDX_ID, value);
  }

  get action(): V8BridgeAction {
    let result = V8BridgeAction.NOT_SET;
    if (this.args.size > BRIDGE_MSG_IDX_ACTION) {
      const value = this.args.get_value(BRIDGE_MSG_IDX_ACTION);
      if (value.value_type === ValueType.VTYPE_INT) {
        result = value.int;
      }
    }
    return result;
  }

  set action(
    value: V8BridgeAction
  ) {
    if (this.args.size < BRIDGE_MSG_IDX_ACTION + 1) {
      this.args.set_size(BRIDGE_MSG_IDX_ACTION + 1);
    }
    this.args.set_int(BRIDGE_MSG_IDX_ACTION, value);
  }

  get payload(): string {
    let result = '';
    if (this.args.size > BRIDGE_MSG_IDX_PAYLOAD) {
      const value = this.args.get_value(BRIDGE_MSG_IDX_PAYLOAD);
      if (value.value_type === ValueType.VTYPE_STRING) {
        result = value.str;
      }
    }
    return result;
  }

  set payload(
    value: string
  ) {
    if (this.args.size < BRIDGE_MSG_IDX_PAYLOAD + 1) {
      this.args.set_size(BRIDGE_MSG_IDX_PAYLOAD + 1);
    }
    this.args.set_string(BRIDGE_MSG_IDX_PAYLOAD, value);
  }
}
