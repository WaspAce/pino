import { misc } from './../misc/misc';
import { BezierPath } from './../bezier/bezier_path';
import { PinoBrowser } from './browser/browser';
import { Pino } from '../pino';

const DEFAULT_MOVE_SPEED = 15;

export class PinoTab {

  screen_info: ScreenInfo;
  gui_tab_index = -1;
  browser: PinoBrowser;
  last_mouse_point = new Point(0, 0);

  private on_initialized: (value?: any) => void;

  private create_browser(
    create_browser: boolean
  ) {
    this.browser = new PinoBrowser(this, create_browser);
  }

  private resolve_initialized() {
    if (this.on_initialized) {
      const resolve = this.on_initialized;
      this.on_initialized = undefined;
      resolve();
    }
  }

  constructor(
    readonly pino: Pino,
    create_browser?: boolean
  ) {
    this.create_browser(create_browser);
  }

  view_resized(): void {
    if (this.browser) {
      this.browser.was_resized();
    }
  }

  send_mouse_wheel_event(
    event: MouseEvent,
    delta: number
  ) {
    if (this.browser) {
      this.browser.send_mouse_wheel_event(event, delta);
    }
    this.last_mouse_point.x = event.x;
    this.last_mouse_point.y = event.y;
  }

  send_mouse_down_event(
    event: MouseEvent,
    button: MouseButtonType
  ) {
    if (this.browser) {
      this.browser.send_mouse_down_event(event, button);
    }
    this.last_mouse_point.x = event.x;
    this.last_mouse_point.y = event.y;
  }

  send_mouse_up_event(
    event: MouseEvent,
    button: MouseButtonType
  ) {
    if (this.browser) {
      this.browser.send_mouse_up_event(event, button);
    }
    this.last_mouse_point.x = event.x;
    this.last_mouse_point.y = event.y;
  }

  send_mouse_move_event(
    event: MouseEvent,
    mouse_leave?: boolean
  ) {
    if (this.browser) {
      this.browser.send_mouse_move_event(event, mouse_leave);
      if (this.pino.gui) {
        this.pino.gui.cursor_moved(event.x, event.y);
      }
    }
    this.last_mouse_point.x = event.x;
    this.last_mouse_point.y = event.y;
  }

  send_touch_event(
    event: TouchEvent
  ) {
    if (this.browser) {
      this.browser.send_touch_event(event);
      // if (this.pino.gui) {
      //   this.pino.gui.cursor_moved(event.x, event.y);
      // }
    }
    this.last_mouse_point.x = event.x;
    this.last_mouse_point.y = event.y;
  }

  send_key_press(
    event: KeyEvent
  ) {
    if (this.browser) {
      this.browser.send_key_press(event);
    }
  }

  send_key_down(
    event: KeyEvent
  ) {
    if (this.browser) {
      this.browser.send_key_down(event);
    }
  }

  send_key_up(
    event: KeyEvent
  ) {
    if (this.browser) {
      this.browser.send_key_up(event);
    }
  }

  browser_created() {
    if (this.pino.gui) {
      this.browser.add_draw_target(this.pino.gui.view_image);
    }
    this.resolve_initialized();
  }

  async wait_initialized() {
    await new Promise(resolve => {
      this.on_initialized = resolve;
      if (this.browser.native) {
        this.resolve_initialized();
      }
    });
    await this.browser.wait_loaded();
  }

  async load(
    url: string,
    referrer?: string,
    referrer_policy?: ReferrerPolicy
  ) {
    return this.browser.load(url, referrer, referrer_policy);
  }

  async wait_loaded() {
    return this.browser.wait_loaded();
  }

  was_hidden(
    hidden: boolean
  ) {
    this.browser.was_hidden(hidden);
  }

  was_painted() {
    if (this.pino.gui) {
      this.pino.gui.browser_was_painted();
    }
  }

  async find_elements(
    selector: string
  ): Promise<any[]> {
    return new Promise<any[]>(resolve => {
      const jq_promises: Array<Promise<any>> = [];
      this.browser.frames.forEach(frame => {
        jq_promises.push(frame.eval(`Reflect.find_elements(${JSON.stringify(selector)})`));
      });
      Promise.all(jq_promises).then(async jqs => {
        const element_promises: Array<Promise<any>> = [];
        for (const jq of jqs) {
          const length = await jq.length;
          for (let i = 0; i < length; i++) {
            element_promises.push(jq[i]);
          }
        }
        resolve(await Promise.all(element_promises));
      });
    });
  }

  async scroll(
    delta: number,
    horizontal?: boolean
  ) {
    if (this.pino.is_mobile) {
      const start_point = new Point(this.last_mouse_point.x, this.last_mouse_point.y);
      const end_point = new Point();
      if (horizontal) {
        end_point.y = start_point.y + (10 - Math.random() * 20);
        end_point.x = start_point.x + delta;
      } else {
        end_point.y = start_point.y + delta;
        end_point.x = start_point.x + (10 - Math.random() * 20);
      }

      const event = new TouchEvent();
      event.id = 1;
      event.modifiers = [EventFlags.EVENTFLAG_LEFT_MOUSE_BUTTON];
      event.pointer_type = PointerType.CEF_POINTER_TYPE_TOUCH;
      event.type_ = TouchEventType.CEF_TET_PRESSED;
      event.x = start_point.x;
      event.y = start_point.y;
      this.send_touch_event(event);
      await misc.sleep(10 + Math.random() * 5);

      const path = new BezierPath(
        start_point,
        end_point,
        this.pino.screen.view_rect,
        DEFAULT_MOVE_SPEED
      );
      for (const path_point of path.points) {
        event.type_ = TouchEventType.CEF_TET_MOVED;
        event.x = path_point.x;
        event.y = path_point.y;
        this.pino.send_touch_event(event);
        await misc.sleep(10 + Math.random() * 5);
      }

      event.type_ = TouchEventType.CEF_TET_RELEASED;
      event.x = end_point.x;
      event.y = end_point.y;
      this.send_touch_event(event);

      this.last_mouse_point = start_point;
    } else {
      const event = new MouseEvent();
      event.x = this.last_mouse_point.x;
      event.y = this.last_mouse_point.y;
      if (horizontal) {
        event.modifiers = [EventFlags.EVENTFLAG_SHIFT_DOWN];
      }
      this.send_mouse_wheel_event(event, delta);
    }
  }

  async move_to(
    point: Point,
    mouse_leave?: boolean
  ) {
    if (this.pino.is_mobile) {
      this.last_mouse_point = point;
    } else {
      const path = new BezierPath(
        this.last_mouse_point,
        point,
        this.pino.screen.view_rect,
        DEFAULT_MOVE_SPEED
      );
      for (const path_point of path.points) {
        const event = new MouseEvent();
        event.x = path_point.x;
        event.y = path_point.y;
        this.send_mouse_move_event(event, mouse_leave);
        await misc.sleep(10 + Math.random() * 5);
      }
    }
  }

  async click(
    point: Point
  ) {
    if (this.pino.is_mobile) {
      const event = new TouchEvent();
      event.id = 1;
      event.modifiers = [];
      event.pointer_type = PointerType.CEF_POINTER_TYPE_TOUCH;
      event.type_ = TouchEventType.CEF_TET_PRESSED;
      event.x = point.x;
      event.y = point.y;
      this.send_touch_event(event);
      await misc.sleep(100 + Math.random() * 50);
      event.type_ = TouchEventType.CEF_TET_RELEASED;
      this.send_touch_event(event);
    } else {
      const event = new MouseEvent();
      event.x = point.x;
      event.y = point.y;
      this.send_mouse_down_event(event, MouseButtonType.MBT_LEFT);
      await misc.sleep(10 + Math.random() * 10);
      this.send_mouse_up_event(event, MouseButtonType.MBT_LEFT);
    }
  }
}
