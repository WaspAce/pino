import { PinoElementRects } from './../../element_rects/element_rects';
import { PinoTab } from './../../tab/tab';
import { Pino } from './../../pino';
import {
  MOUSE_SCROLL_DELTA_DEFAULT,
  SCROLL_MAX_TRIES,
  TOUCH_SCROLL_DELTA_DEFAULT
} from './../../common';
import { misc } from './../../misc/misc';
import { V8POOl_NAME } from './../v8_pool/v8_pool';
import { PinoV8SetPropertyOptions, PinoV8CallMethodOptions } from './../v8_payload_types';
import { PinoV8GetPropertyOptions } from '../v8_payload_types';
import { PinoV8ValueType, get_value_type } from './../v8_value/v8_value_type';
import { PinoV8BridgeMessage, V8BridgeAction } from './../v8_bridge_message/v8_bridge_message';
import { PinoV8Bridge, V8BRIDGE_RESPONE_TIMEOUT_MS } from '../v8_bridge';
import { PinoV8Value } from '../v8_value/v8_value';
import { PinoFrame } from '../../tab/browser/frame/frame';

export class PinoV8Proxy {

  native: JSObjectProxy;
  is_bridge_proxy = true;

  private higilight_image: Image;

  private async send_get_property_request(
    name: string
  ): Promise<any> {
    const request = new PinoV8BridgeMessage();
    request.action = V8BridgeAction.MAIN_GET_PROPERTY;
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
    request.action = V8BridgeAction.MAIN_SET_PROPERTY;
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
    } else {
      return new Promise<any>(resolve => {
        this.send_get_property_request(name).then(value => {
          resolve(value);
        });
      });
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
    request.action = V8BridgeAction.MAIN_CALL_METHOD;
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
    return new Promise<any>(resolve => {
      this.send_call_method_request(name).then(value => {
        resolve(value);
      });
    });
  }

  private async get_rect(): Promise<Rect> {
    const result = new Rect();
    const rect_response = await this.frame.eval(`
      (() => {
        const element = Reflect.${V8POOl_NAME}[${this.pool_id}];
        return JSON.stringify(Reflect.get_element_rect(element));
      })();
    `);
    if (rect_response) {
      const rect = JSON.parse(rect_response);
      result.x = rect.x;
      result.y = rect.y;
      result.width = rect.width;
      result.height = rect.height;
    }
    return result;
  }

  constructor(
    private readonly bridge: PinoV8Bridge,
    private readonly pool_id: number,
    private readonly frame: PinoFrame
  ) {
    this.native = new JSObjectProxy(this);
    this.native.get_property = this.do_on_get_property;
    this.native.set_property = this.do_on_set_property;
    this.native.call_method = this.do_on_call_method;
    if (this.pino.gui) {
      this.higilight_image = new Image();
    }
  }

  async get_rects(): Promise<PinoElementRects> {
    const [frame_rects, element_rect] = await Promise.all([
      this.frame.get_rects(),
      this.get_rect()
    ]);
    const result: PinoElementRects = new PinoElementRects();
    result.full.x = frame_rects.full.x + element_rect.x;
    result.full.y = frame_rects.full.y + element_rect.y;
    result.full.width = element_rect.width;
    result.full.height = element_rect.height;

    const view_right = Math.min(result.full.right, result.full.x + element_rect.right, frame_rects.view.right);
    const view_bottom = Math.min(result.full.bottom, result.full.x + element_rect.bottom, frame_rects.view.bottom);
    result.view.x = Math.max(result.full.x, result.view.x);
    result.view.y = Math.max(result.full.y, result.view.y);
    result.view.right = view_right;
    result.view.bottom = view_bottom;
    if (result.view.width < 0 || result.view.height < 0) {
      result.view.width = 0;
      result.view.height = 0;
    }
    return result;
  }

  async move_to(): Promise<PinoElementRects> {
    let [frame_rects, element_rects] = await Promise.all([
      this.frame.get_rects(),
      this.get_rects()
    ]);
    if (element_rects.full.width > 0 && element_rects.full.height > 0) {
      if (!frame_rects.view.intersects(element_rects.view)) {
        element_rects = await this.scroll_to();
        frame_rects = await this.frame.get_rects();
      }
      const rect = element_rects.view_with_padding;
      if (frame_rects.view.intersects(rect)) {
        await this.tab.move_to(new Point(
          rect.x + Math.random() * rect.width,
          rect.y + Math.random() * rect.height
        ));
      } else {
        throw new Error('Element is not in view');
      }
    }
    return element_rects;
  }

  async scroll_to(): Promise<PinoElementRects> {
    let frame_rects = await this.frame.get_rects();
    if (!frame_rects.view_with_padding.has_point(this.tab.last_mouse_point)) {
      frame_rects = await this.frame.move_to();
    }
    let element_rects = await this.get_rects();
    if (!frame_rects.view.intersects(element_rects.view_with_padding)) {
      let rect_before_scroll = new Rect();
      let tries = 0;
      while (
        !frame_rects.view.intersects(element_rects.view_with_padding) &&
        tries < SCROLL_MAX_TRIES
      ) {
        rect_before_scroll = element_rects.full;
        frame_rects = await this.frame.get_rects();
        await this.frame.scroll(element_rects.full.center.y - frame_rects.view.center.y);
        element_rects = await this.get_rects();
        if (rect_before_scroll.top === element_rects.full.top) {
          tries++;
          await this.frame.move_to(new Point(
            Math.random() * frame_rects.view.width,
            Math.random() * frame_rects.view.height
          ));
        }
      }
    }
    return element_rects;
  }

  async click() {
    await this.move_to();
    this.tab.click();
  }

  get pino(): Pino {
    return this.frame.pino;
  }

  get tab(): PinoTab {
    return this.frame.tab;
  }
}
