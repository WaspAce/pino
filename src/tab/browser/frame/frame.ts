import { misc } from './../../../misc/misc';
import { BezierPath } from './../../../bezier/bezier_path';
import {
  MOUSE_SCROLL_DELTA_DEFAULT,
  SCROLL_MAX_TRIES,
  TOUCH_MOVE_SPEED_MIN,
  TOUCH_MOVE_SPEED_MAX,
  TOUCH_MIN_INTERVAL_MS,
  TOUCH_MAX_INTERVAL_MS,
  TOUCH_SCROLL_DELTA_DEFAULT
} from './../../../common';
import { PinoElementRects } from './../../../element_rects/element_rects';
import { PinoTab } from './../../tab';
import { PinoBrowser } from './../browser';
import { Pino } from './../../../pino';
import { IPC_V8_BRIDGE_MSG } from '../../../v8_bridge/v8_bridge_message/v8_bridge_message';
import { PinoV8Bridge } from '../../../v8_bridge/v8_bridge';

export class PinoFrame {

  parent: PinoFrame;
  children: PinoFrame[] = [];

  private bridge: PinoV8Bridge;
  private higilight_image: Image;

  private get_frame_rect(
    current_frame: PinoFrame,
    promises: Array<Promise<Rect>>
  ) {
    if (current_frame.native.is_main) {
      promises.push(new Promise<Rect>(resolve => {
        current_frame.eval(`Reflect.get_window_size()`).then(sizes_str => {
          const sizes = JSON.parse(sizes_str);
          resolve(new Rect(0, 0, sizes.width, sizes.height));
        });
      }));
    } else {
      this.get_frame_rect(current_frame.parent, promises);
      promises.push(new Promise<Rect>(resolve => {
        current_frame.parent.eval(`
          Reflect.get_child_frame_rect(
              ${JSON.stringify(current_frame.native.url)}
            )
        `).then(response => {
          const current_frame_rect = JSON.parse(response);
          resolve(new Rect(
            current_frame_rect.x,
            current_frame_rect.y,
            current_frame_rect.width,
            current_frame_rect.height
          ));
        });
      }));
    }
  }

  private async scroll_mouse(
    distance: number
  ) {
    const rects = await this.get_rects();
    if (!rects.view_with_padding.has_point(this.tab.last_mouse_point)) {
      await this.move_to();
    }
    const direction = -Math.sign(distance);
    const scroll_count = Math.ceil(Math.abs(distance / MOUSE_SCROLL_DELTA_DEFAULT));
    const event = new MouseEvent();
    event.x = this.tab.last_mouse_point.x;
    event.y = this.tab.last_mouse_point.y;
    for (let i = 0; i < scroll_count; i++) {
      this.tab.send_mouse_wheel_event(event, direction * MOUSE_SCROLL_DELTA_DEFAULT);
      await misc.sleep(50 + Math.random() * 50);
    }
  }

  private async scroll_touch(
    distance: number
  ) {
    let rects = await this.get_rects();
    if (!rects.view_with_padding.has_point(this.tab.last_mouse_point)) {
      rects = await this.move_to();
    }
    const with_padding = rects.view_with_padding;
    const start_point = with_padding.center;
    const end_point = new Point();
    const direction = -Math.sign(distance);
    let scroll_distance = TOUCH_SCROLL_DELTA_DEFAULT;
    if (direction < 0) {
      scroll_distance = Math.min(start_point.y, TOUCH_SCROLL_DELTA_DEFAULT);
    } else {
      scroll_distance = Math.min(this.pino.app.screen.view_rect.height - start_point.y, TOUCH_SCROLL_DELTA_DEFAULT);
    }
    const scroll_count = Math.ceil(Math.abs(distance / scroll_distance));
    start_point.x = with_padding.x + Math.random() * (with_padding.width - 20);
    for (let i = 0; i < scroll_count; i++) {
      start_point.x = start_point.x + 10 - Math.random() * 20;
      end_point.y = start_point.y + direction * scroll_distance;
      end_point.x = start_point.x + 10 - Math.random() * 20;
      const path = new BezierPath(
        start_point,
        end_point,
        new Rect(
          start_point.x - 20,
          start_point.y,
          end_point.x + 20,
          end_point.y
        ),
        misc.random_int(TOUCH_MOVE_SPEED_MIN, TOUCH_MOVE_SPEED_MAX)
      );
      const event = new TouchEvent();
      event.id = 1;
      event.modifiers = [EventFlags.EVENTFLAG_LEFT_MOUSE_BUTTON];
      event.pointer_type = PointerType.CEF_POINTER_TYPE_TOUCH;
      event.type_ = TouchEventType.CEF_TET_PRESSED;
      event.x = start_point.x;
      event.y = start_point.y;
      this.tab.send_touch_event(event);
      await misc.sleep(TOUCH_MIN_INTERVAL_MS);
      path.points.forEach(async point => {
        event.type_ = TouchEventType.CEF_TET_MOVED;
        event.x = point.x;
        event.y = point.y;
        this.tab.send_touch_event(event);
        await misc.sleep(misc.random_int(TOUCH_MIN_INTERVAL_MS, TOUCH_MAX_INTERVAL_MS));
      });
      event.type_ = TouchEventType.CEF_TET_RELEASED;
      event.x = end_point.x;
      event.y = end_point.y;
      this.tab.send_touch_event(event);
    }
  }

  constructor(
    public readonly native: Frame,
    readonly browser: PinoBrowser
  ) {
    this.bridge = new PinoV8Bridge(native);
    if (this.pino.gui) {
      this.higilight_image = new Image();
    }
  }

  async eval(
    code: string
  ): Promise<any> {
    return this.bridge.eval(code, this);
  }

  async eval_and_wait_data(
    code: string
  ): Promise<any> {
    return this.bridge.eval_and_wait_data(code, this);
  }

  async find_elements(
    selector: string
  ): Promise<any[]> {
    const jq = await this.eval(`Reflect.find_elements(${JSON.stringify(selector)})`);
    const lng = await jq.length;
    const element_promises = [];
    for (let i = 0; i < lng; i++) {
      element_promises.push(jq[i]);
    }
    return await Promise.all(element_promises);
  }

  async get_random_element(
    selector?: string
  ): Promise<any> {
    if (!selector) {
      selector = '*';
    }
    return await this.eval(`Reflect.get_random_element(${JSON.stringify(selector)})`);
  }

  async get_internal_links(): Promise<any> {
    const jq = await this.eval(`Reflect.get_internal_links()`);
    const lng = await jq.length;
    const element_promises = [];
    for (let i = 0; i < lng; i++) {
      element_promises.push(jq[i]);
    }
    return await Promise.all(element_promises);
  }

  async get_random_internal_link(): Promise<any> {
    return await this.eval(`Reflect.get_random_internal_link()`);
  }

  receive_ipc_message(
    message: ProcessMessage
  ) {
    if (message.name === IPC_V8_BRIDGE_MSG) {
      this.bridge.receive_message(message);
    }
  }

  async get_rects(): Promise<PinoElementRects> {
    const promises: Array<Promise<Rect>> = [];
    this.get_frame_rect(this, promises);
    const rects = await Promise.all(promises);
    const result = new PinoElementRects();
    rects.forEach((rect, index) => {
      result.full.x += rect.x;
      result.full.y += rect.y;
      result.full.width = rect.width;
      result.full.height = rect.height;

      if (index === 0) {
        result.view.x = rect.x;
        result.view.y = rect.y;
        result.view.width = rect.width;
        result.view.height = rect.height;
      } else {
        const view_right = Math.min(result.full.right, result.view.right);
        const view_bottom = Math.min(result.full.bottom, result.view.bottom);
        result.view.x = Math.max(result.full.x, result.view.x);
        result.view.y = Math.max(result.full.y, result.view.y);
        result.view.right = view_right;
        result.view.bottom = view_bottom;
        if (result.view.width < 0 || result.view.height < 0) {
          result.view.width = 0;
          result.view.height = 0;
        }
      }
    });
    return result;
  }

  async higilight(
    color: string
  ) {
    if (this.pino.gui) {
      const rects = await this.get_rects();
      if (
        this.higilight_image.x !== rects.view.x ||
        this.higilight_image.y !== rects.view.y ||
        this.higilight_image.width !== rects.view.width ||
        this.higilight_image.height !== rects.view.height
      ) {
        this.higilight_image.x = rects.view.x;
        this.higilight_image.y = rects.view.y;
        this.higilight_image.width = rects.view.width;
        this.higilight_image.height = rects.view.height;
        this.higilight_image.clear();
        for (let i = 0; i < rects.view.width; i++) {
          this.higilight_image.set_pixel(i, 0, color);
          this.higilight_image.set_pixel(i, rects.view.height - 1, color);
        }
        for (let i = 0; i < rects.view.height; i++) {
          this.higilight_image.set_pixel(0, i, color);
          this.higilight_image.set_pixel(rects.view.width - 1, i, color);
        }
        this.pino.gui.add_image(this.higilight_image);
      }
    }
  }

  async move_to(
    frame_point?: Point
  ): Promise<PinoElementRects> {
    let rects = await this.get_rects();
    const view = new Rect(0, 0, this.pino.app.screen.view_rect.width, this.pino.app.screen.view_rect.height);
    if (!view.intersects(rects.view_with_padding)) {
      rects = await this.scroll_to();
    }
    const point = new Point();
    const rect = rects.view_with_padding;
    if (frame_point) {
      point.x = rects.full.x + frame_point.x;
      point.y = rects.full.y + frame_point.y;
    } else if (!rect.has_point(this.tab.last_mouse_point)) {
      point.x = rect.x + Math.random() * rect.width;
      point.y = rect.y + Math.random() * rect.height;
    }
    await this.tab.move_to(point);
    return rects;
  }

  async scroll_to(): Promise<PinoElementRects> {
    let rects = await this.get_rects();
    if (this.parent) {
      const view = new Rect(0, 0, this.pino.app.screen.view_rect.width, this.pino.app.screen.view_rect.height);
      if (!view.intersects(rects.view_with_padding)) {
        const parent_rects = await this.parent.get_rects();
        if (!parent_rects.view_with_padding.has_point(this.tab.last_mouse_point)) {
          await this.parent.move_to();
        }
        rects = await this.get_rects();
        let tries = 0;
        let rect_before_scroll = new Rect();
        while (
          !!view.intersects(rects.view_with_padding) &&
          tries < SCROLL_MAX_TRIES
        ) {
          rect_before_scroll = rects.full;
          await this.scroll(rects.view_with_padding.center.y);
          rects = await this.get_rects();
          if (rect_before_scroll.top === rects.full.top) {
            tries++;
            await this.parent.move_to(new Point(10, 10));
            await this.tab.move_to(new Point(
              this.tab.last_mouse_point.x + 2,
              this.tab.last_mouse_point.y + 2
            ));
          }
        }
      }
    }
    return rects;
  }

  async scroll(
    distance: number
  ) {
    if (this.pino.is_mobile) {
      await this.scroll_touch(distance);
    } else {
      await this.scroll_mouse(distance);
    }
  }

  get pino(): Pino {
    return this.browser.pino;
  }

  get tab(): PinoTab {
    return this.browser.tab;
  }
}
