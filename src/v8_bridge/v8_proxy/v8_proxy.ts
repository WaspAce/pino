import { PinoTab } from './../../tab/tab';
import { Pino } from './../../pino';
import { PinoElementRects, ELEMENT_MIN_SIZE, SCROLL_DELTA_DEFAULT, SCROLL_MAX_TRIES } from './../../common';
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
    const result: PinoElementRects = {
      full: new Rect(),
      view: new Rect()
    };
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

  async highlight(
    color: string
  ) {
    if (this.pino.gui) {
      const rects = await this.get_rects();
      if (this.pino.screen.view_rect.intersects(rects.full)) {
        const rect = rects.full;
        if (
          this.higilight_image.x !== rect.x ||
          this.higilight_image.y !== rect.y ||
          this.higilight_image.width !== rect.width ||
          this.higilight_image.height !== rect.height
        ) {
          this.higilight_image.x = rect.x;
          this.higilight_image.y = rect.y;
          this.higilight_image.width = rect.width;
          this.higilight_image.height = rect.height;
          this.higilight_image.clear();
          for (let i = 0; i < rect.width; i++) {
            this.higilight_image.set_pixel(i, 0, color);
            this.higilight_image.set_pixel(i, rect.height - 1, color);
          }
          for (let i = 0; i < rect.height; i++) {
            this.higilight_image.set_pixel(0, i, color);
            this.higilight_image.set_pixel(rect.width - 1, i, color);
          }
          this.pino.gui.add_image(this.higilight_image);
        }
      }
    }
  }

  async move_to(): Promise<PinoElementRects> {
    let rects = await this.get_rects();
    if (rects.full.width >= ELEMENT_MIN_SIZE && rects.full.height >= ELEMENT_MIN_SIZE) {
      if (!this.pino.screen.view_rect.intersects(rects.view)) {
        rects = await this.scroll_to();
      }
      const rect = rects.view;
      if (this.pino.screen.view_rect.intersects(rect)) {
        rect.x += Math.floor(rect.width / 10);
        rect.y += Math.floor(rect.height / 10);
        rect.width -= Math.floor(rect.width / 5);
        rect.height -= Math.floor(rect.height / 5);
        await this.tab.move_to(new Point(
          rect.x + Math.random() * rect.width,
          rect.y + Math.random() * rect.height
        ));
      } else {
        throw new Error('Element is not in view');
      }
    }
    return rects;
  }

  async scroll_to(): Promise<PinoElementRects> {
    let frame_rects: PinoElementRects;
    if (!this.frame.native.is_main) {
      frame_rects = await this.frame.move_to();
    } else {
      frame_rects = await this.frame.get_rects();
    }
    let element_rects = await this.get_rects();
    if (this.pino.screen.view_rect.intersects(frame_rects.view)) {
      let rect_before_scroll = new Rect();
      let tries = 0;
      let direction = 0;
      if (element_rects.view.top > frame_rects.view.bottom) {
        direction = -1;
      } else {
        direction = 1;
      }
      while (
        !frame_rects.view.intersects(element_rects.view) &&
        tries < SCROLL_MAX_TRIES
      ) {
        rect_before_scroll = element_rects.full;
        await this.frame.tab.scroll(direction * SCROLL_DELTA_DEFAULT);
        await misc.sleep(50 + Math.random() * 50);
        element_rects = await this.get_rects();
        if (rect_before_scroll.top === element_rects.full.top) {
          tries++;
          await this.frame.move_to();
          await this.tab.move_to(new Point(
            this.tab.last_mouse_point.x + 2,
            this.tab.last_mouse_point.y + 2
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
