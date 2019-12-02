import { MAX_TIMEOUT_MS } from './../../../common';
import { PinoElementRects } from '../../../element_rects/element_rects';
import { PinoTab } from '../../tab';
import { Pino } from '../../../pino';
import { SCROLL_MAX_TRIES } from '../../../common';
import { V8POOl_NAME } from '../../../subprocess/v8_bridge/v8_pool/v8_pool';
import { PinoV8SetPropertyOptions, PinoV8CallMethodOptions } from '../v8_payload_types';
import { PinoV8GetPropertyOptions } from '../v8_payload_types';
import { PinoV8ValueType, get_value_type } from '../../../subprocess/v8_bridge/v8_value/v8_value_type';
import { PinoV8BridgeMessage, V8BridgeAction } from '../v8_bridge_message/v8_bridge_message';
import { PinoV8Value } from '../../../subprocess/v8_bridge/v8_value/v8_value';
import { PinoFrame } from '../../browser/frame/frame';
import { PinoV8BridgeBrowser, V8BRIDGE_RESPONE_TIMEOUT_MS } from '../v8_bridge_browser/v8_bridge_browser';

export class PinoV8Proxy {

  native: JSObjectProxy;
  is_bridge_proxy = true;

  private async send_get_property_request(
    name: string
  ): Promise<any> {
    const request = new PinoV8BridgeMessage();
    request.action = V8BridgeAction.BROWSER_GET_PROPERTY;
    const options: PinoV8GetPropertyOptions = {
      parent_id: this.pool_id,
      property_name: name
    };
    request.payload = JSON.stringify(options);
    const response = await this.bridge.send_message(request, V8BRIDGE_RESPONE_TIMEOUT_MS);
    const value: PinoV8Value = JSON.parse(response.payload);
    if (value.value_type < PinoV8ValueType.UNDEFINED) {
      return value.value;
    } else if (value.value_type > PinoV8ValueType.UNDEFINED) {
      return new PinoV8Proxy(this.bridge, value.pool_id, this.frame).native;
    }
  }

  private send_set_property_request(
    name: string,
    value: any
  ) {
    const value_type = get_value_type(value);
    const pino_value: PinoV8Value = {
      value_type
    };
    if (value_type === PinoV8ValueType.OBJECT && !value.wrapper.is_bridge_proxy) {
      throw new Error('Cannot set proxy object property as non-proxy object');
    } else if (value_type < PinoV8ValueType.UNDEFINED) {
      pino_value.value = value;
    } else if (value_type > PinoV8ValueType.UNDEFINED) {
      pino_value.pool_id = value.wrapper.bridge_pool_id;
    }
    const options: PinoV8SetPropertyOptions = {
      parent_id: this.pool_id,
      property_name: name,
      value: pino_value
    };
    const request = new PinoV8BridgeMessage();
    request.action = V8BridgeAction.BROWSER_SET_PROPERTY;
    request.payload = JSON.stringify(options);
    this.bridge.send_message(request, V8BRIDGE_RESPONE_TIMEOUT_MS);
  }

  private do_on_get_property(
    name: string
  ): any {
    if (name === 'wrapper') {
      return this;
    } else if (this[name]) {
      return this[name];
    } else if (name !== 'then') {
      return this.send_get_property_request(name);
    }
  }

  private do_on_set_property(
    name: string,
    value: any
  ) {
    this.send_set_property_request(name, value);
  }

  private async send_call_method_request(
    name: string
  ): Promise<any> {
    const request = new PinoV8BridgeMessage();
    request.action = V8BridgeAction.BROWSER_CALL_METHOD;
    const options: PinoV8CallMethodOptions = {
      parent_id: this.pool_id,
      method_name: name
    };
    request.payload = JSON.stringify(options);
    const response = await this.bridge.send_message(request, V8BRIDGE_RESPONE_TIMEOUT_MS);
    const value: PinoV8Value = JSON.parse(response.payload);
    if (value.value_type < PinoV8ValueType.UNDEFINED) {
      return value.value;
    } else if (value.value_type > PinoV8ValueType.UNDEFINED) {
      return new PinoV8Proxy(this.bridge, value.pool_id, this.frame).native;
    }
  }

  do_on_call_method(
    name: string,
    ...args: any[]
  ): any {
    return this.send_call_method_request(name);
  }

  private scroll_into_view() {
    this.frame.eval(`
      (() => {
        const element = Reflect.${V8POOl_NAME}[${this.pool_id}];
        element.scrollIntoView();
      })();
    `);
  }

  constructor(
    private readonly bridge: PinoV8BridgeBrowser,
    private readonly pool_id: number,
    private readonly frame: PinoFrame
  ) {
    this.native = new JSObjectProxy(this);
    this.native.get_property = this.do_on_get_property;
    this.native.set_property = this.do_on_set_property;
    this.native.call_method = this.do_on_call_method;
  }

  async get_rects(): Promise<PinoElementRects> {
    return await this.bridge.get_element_rects(this.pool_id);
  }

  async move_to(
    timeout_ms?: number
  ): Promise<PinoElementRects> {
    if (!timeout_ms || timeout_ms < 0) {
      timeout_ms = MAX_TIMEOUT_MS;
    }
    this.frame.check_is_valid();
    const start_time = new Date().getTime();
    let [frame_rects, element_rects] = await Promise.all([
      this.frame.get_rects(),
      this.get_rects()
    ]);
    let remains_ms = start_time + timeout_ms - new Date().getTime();
    if (element_rects.full.width > 0 && element_rects.full.height > 0) {
      if (!frame_rects.view.intersects(element_rects.view)) {
        element_rects = await this.scroll_to(remains_ms);
        frame_rects = await this.frame.get_rects();
      }
      const rect = element_rects.view_with_padding;
      if (frame_rects.view.intersects(rect)) {
        remains_ms = start_time + timeout_ms - new Date().getTime();
        await this.tab.move_to(new Point(
          rect.x + Math.random() * rect.width,
          rect.y + Math.random() * rect.height
        ), remains_ms);
      } else {
        console.log('Frame rects: ', frame_rects);
        console.log('Element rects: ', element_rects);
        throw new Error('Element is not in view');
      }
    }
    return element_rects;
  }

  async scroll_to(
    timeout_ms?: number
  ): Promise<PinoElementRects> {
    if (!timeout_ms) {
      timeout_ms = MAX_TIMEOUT_MS;
    }
    this.frame.check_is_valid();
    const start_time = new Date().getTime();
    let frame_rects = await this.frame.get_rects();
    let remains_ms = start_time + timeout_ms - new Date().getTime();
    if (!frame_rects.view_with_padding.has_point(this.tab.last_mouse_point)) {
      frame_rects = await this.frame.move_to(remains_ms);
    }
    let element_rects = await this.get_rects();
    if (!frame_rects.view.intersects(element_rects.view_with_padding)) {
      let rect_before_scroll = new Rect();
      let tries = 0;
      remains_ms = start_time + timeout_ms - new Date().getTime();
      while (
        !frame_rects.view.intersects(element_rects.view_with_padding) &&
        tries < SCROLL_MAX_TRIES &&
        remains_ms > 0
      ) {
        rect_before_scroll = element_rects.full;
        frame_rects = await this.frame.get_rects();
        remains_ms = start_time + timeout_ms - new Date().getTime();
        await this.frame.scroll(element_rects.full.center.y - frame_rects.view.center.y, remains_ms);
        element_rects = await this.get_rects();
        remains_ms = start_time + timeout_ms - new Date().getTime();
        if (rect_before_scroll.top === element_rects.full.top) {
          tries++;
          remains_ms = start_time + timeout_ms - new Date().getTime();
          await this.frame.move_to(remains_ms, new Point(
            Math.random() * frame_rects.view.width,
            Math.random() * frame_rects.view.height
          ));
        }
      }
    }
    if (!frame_rects.view.intersects(element_rects.view)) {
      this.scroll_into_view();
      element_rects = await this.get_rects();
    }
    return element_rects;
  }

  async click(
    timeout_ms: number
  ) {
    this.frame.check_is_valid();
    await this.move_to(timeout_ms);
    this.tab.click();
  }

  get pino(): Pino {
    return this.frame.pino;
  }

  get tab(): PinoTab {
    return this.frame.tab;
  }
}
