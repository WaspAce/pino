import { PinoTab } from './../../tab';
import { PinoElementRects, ELEMENT_MIN_SIZE } from './../../../common';
import { misc } from './../../../misc/misc';
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
    const result: PinoElementRects = {
      full: new Rect(),
      view: new Rect()
    };
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
    random_point?: boolean
  ): Promise<PinoElementRects> {
    let rects = await this.get_rects();
    if (!this.pino.screen.view_rect.intersects(rects.view)) {
      await this.scroll_to();
      rects = await this.get_rects();
    }
    const rect = rects.view;
    const point = new Point();
    if (random_point) {
      point.x = rect.x + Math.random() * rect.width;
      point.y = rect.y + Math.random() * rect.height;
    } else {
      // const horizontal_edge = Math.random() > 0.5;
      const horizontal_edge = false;
      if (horizontal_edge) {
        point.x = rect.x + Math.random() * rect.width;
        point.y = rect.y + Math.random() * ELEMENT_MIN_SIZE;
      } else {
        point.x = rect.x + Math.random() * ELEMENT_MIN_SIZE;
        point.y = rect.y + Math.random() * rect.height;
      }
    }
    await this.tab.move_to(point);
    return rects;
  }

  async scroll_to() {
    const rects = await this.get_rects();
    if (!this.pino.screen.view_rect.intersects(rects.view)) {
      if (this.parent) {
        this.parent.move_to();
      }
    }
  }

  get pino(): Pino {
    return this.browser.pino;
  }

  get tab(): PinoTab {
    return this.browser.tab;
  }
}
