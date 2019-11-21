import { Pino } from '../pino';
import { PinoScreen } from '../app/screen/screen';

export class PinoGui {

  view: GuiPanel;
  tabs: GuiTabs;
  view_image = new Image();

  private form: GuiForm;
  private cursor_point = new Point();
  private cursor_image = new Image();
  private cursor_clear_time = 0;
  
  private on_tab_added: (value?: number) => void;
  private on_form_ready: () => void;
  private on_tabs_ready: () => void;
  private on_view_ready: () => void;

  private do_on_form_paint() {
    this.pino.repaint();
  }

  private do_on_form_ready() {
    if (this.on_form_ready) {
      const resolve = this.on_form_ready;
      this.on_form_ready = undefined;
      resolve();
    }
  }

  private async create_form() {
    return new Promise(resolve => {
      this.form = new GuiForm(this);
      this.on_form_ready = resolve;
      this.form.on_ready = this.do_on_form_ready;
      this.form.on_paint = this.do_on_form_paint;
      const rect = screen.get_monitor(0).workarea_rect;
      this.form.caption = 'Pino';
      this.form.rect.width = rect.width;
      this.form.rect.height = rect.height;
      this.form.visible = true;
    });
  }

  private do_on_tab_plus_click() {
    this.pino.add_tab();
  }

  private do_on_tab_move(
    idx_from: number,
    idx_to: number
  ) {
    if (idx_from === -1) {
      if (this.on_tab_added) {
        const resolve = this.on_tab_added;
        this.on_tab_added = undefined;
        resolve(idx_to);
      }
      this.pino.active_tab_index_changed(idx_to);
    }
  }

  private do_on_tab_click() {
    this.pino.active_tab_index_changed(this.tabs.active_tab_index);
  }

  private do_on_tabs_ready() {
    if (this.on_tabs_ready) {
      const resolve = this.on_tabs_ready;
      this.on_tabs_ready = undefined;
      resolve();
    }
  }

  private async create_tabs() {
    return new Promise(resolve => {
      this.tabs = new GuiTabs(this.form, this);
      this.on_tabs_ready = resolve;
      this.tabs.on_ready = this.do_on_tabs_ready;
      this.tabs.align = AlignType.alTop;
      this.tabs.on_tab_plus_click = this.do_on_tab_plus_click;
      this.tabs.on_tab_move = this.do_on_tab_move;
      this.tabs.on_tab_click = this.do_on_tab_click;
    });
  }

  private on_view_change_bounds(
    rect: Rect
  ) {
    this.view_image.width = this.view.rect.width;
    this.view_image.height = this.view.rect.height;
    this.cursor_image.width = this.view.rect.width;
    this.cursor_image.height = this.view.rect.height;
    this.cursor_image.clear();
    this.pino.view_resized();
  }

  private do_on_view_mouse_wheel(
    delta: number,
    x: number,
    y: number,
    modifiers: EventFlags[]
  ) {
    const event = new MouseEvent();
    event.modifiers = modifiers;
    event.x = x;
    event.y = y;
    this.pino.send_mouse_wheel_event(event, delta);
  }

  private do_on_mouse_down(
    button_type: MouseButtonType,
    x: number,
    y: number,
    modifiers: EventFlags[]
  ) {
    if (this.pino.is_mobile) {
      const event = new TouchEvent();
      event.id = 1;
      event.modifiers = modifiers;
      event.pointer_type = PointerType.CEF_POINTER_TYPE_TOUCH;
      event.type_ = TouchEventType.CEF_TET_PRESSED;
      event.x = x;
      event.y = y;
      this.pino.send_touch_event(event);
    } else {
      const event = new MouseEvent();
      event.modifiers = modifiers;
      event.x = x;
      event.y = y;
      this.pino.send_mouse_down_event(event, button_type);
    }
  }

  private do_on_mouse_up(
    button_type: MouseButtonType,
    x: number,
    y: number,
    modifiers: EventFlags[]
  ) {
    if (this.pino.is_mobile) {
      const event = new TouchEvent();
      event.id = 1;
      event.modifiers = modifiers;
      event.pointer_type = PointerType.CEF_POINTER_TYPE_TOUCH;
      event.type_ = TouchEventType.CEF_TET_RELEASED;
      event.x = x;
      event.y = y;
      this.pino.send_touch_event(event);
    } else {
      const event = new MouseEvent();
      event.modifiers = modifiers;
      event.x = x;
      event.y = y;
      this.pino.send_mouse_up_event(event, button_type);
    }
  }

  private do_on_mouse_move(
    x: number,
    y: number,
    modifiers: EventFlags[]
  ) {
    if (this.pino.is_mobile) {
      if (modifiers.includes(EventFlags.EVENTFLAG_LEFT_MOUSE_BUTTON)) {
        const event = new TouchEvent();
        event.id = 1;
        event.modifiers = modifiers;
        event.pointer_type = PointerType.CEF_POINTER_TYPE_TOUCH;
        event.type_ = TouchEventType.CEF_TET_MOVED;
        event.x = x;
        event.y = y;
        this.pino.send_touch_event(event);
      }
    } else {
      const event = new MouseEvent();
      event.modifiers = modifiers;
      event.x = x;
      event.y = y;
      this.pino.send_mouse_move_event(event);
    }
  }

  private do_on_key_press(
    char: string
  ) {
    const event = new KeyEvent();
    event.event_type = KeyEventType.KEYEVENT_CHAR;
    event.character = char;
    event.windows_key_code = char.charCodeAt(0);
    this.pino.send_key_event(event);
  }

  private do_on_key_down(
    key_code: number,
    modifiers: EventFlags[]
  ) {
    const event = new KeyEvent();
    event.event_type = KeyEventType.KEYEVENT_RAWKEYDOWN;
    event.windows_key_code = key_code;
    event.modifiers = modifiers;
    this.pino.send_key_event(event);
  }

  private do_on_key_up(
    key_code: number,
    modifiers: EventFlags[]
  ) {
    const event = new KeyEvent();
    event.event_type = KeyEventType.KEYEVENT_KEYUP;
    event.windows_key_code = key_code;
    event.modifiers = modifiers;
    this.pino.send_key_event(event);
  }

  private do_on_view_ready() {
    if (this.on_view_ready) {
      const resolve = this.on_view_ready;
      this.on_view_ready = undefined;
      resolve();
    }
  }

  private create_view() {
    return new Promise(resolve => {
      this.view = new GuiPanel(this.form, this);
      this.on_view_ready = resolve;
      this.view.on_ready = this.do_on_view_ready;
      this.view.on_resize = this.on_view_change_bounds;
      this.view.on_mouse_wheel = this.do_on_view_mouse_wheel;
      this.view.on_mouse_down = this.do_on_mouse_down;
      this.view.on_mouse_up = this.do_on_mouse_up;
      this.view.on_mouse_move = this.do_on_mouse_move;
      this.view.on_key_press = this.do_on_key_press;
      this.view.on_key_down = this.do_on_key_down;
      this.view.on_key_up = this.do_on_key_up;
      this.view.align = AlignType.alClient;
      this.view.visible = true;
      if (!this.pino.app.screen.is_default) {
        this.view.rect.copy_from(this.screen.view_rect);
      }
    });
  }

  constructor(
    private readonly pino: Pino
  ) {}

  async init() {
    await this.create_form();
    await this.create_tabs();
    await this.create_view();
  }

  add_tab(): Promise<number> {
    return new Promise<number>(resolve => {
      this.on_tab_added = resolve;
      this.tabs.add_tab(-1, '');
    });
  }

  screen_changed() {
    this.form.rect.copy_from(this.screen.screen_info.available_rect);
  }

  repaint() {
    this.view_image.beginPath();
    if (this.pino.is_mobile) {
      this.view_image.arc(this.cursor_point.x, this.cursor_point.y, 8, 0, 2 * Math.PI);
      this.view_image.setFillStyle('red');
    } else {
      this.view_image.arc(this.cursor_point.x, this.cursor_point.y, 4, 0, 2 * Math.PI);
      this.view_image.setFillStyle('blue');
    }
    this.view_image.fill();
    this.view_image.closePath();
    this.view_image.stroke();
    this.view.paint([this.view_image, this.cursor_image]);
  }

  browser_was_painted() {
    this.repaint();
  }

  cursor_moved(
    x: number,
    y: number
  ) {
    const current_time = new Date().getTime();
    if (current_time - this.cursor_clear_time > 3000) {
      this.cursor_image.clear();
      this.cursor_clear_time = current_time;
    }
    this.cursor_image.beginPath();
    if (this.pino.is_mobile) {
      this.view_image.arc(x, y, 8, 0, 2 * Math.PI);
      this.view_image.setFillStyle('#EB7979');
      this.view_image.fill();
    } else {
      this.cursor_image.moveTo(this.cursor_point.x, this.cursor_point.y);
      this.cursor_image.lineWidth = 2;
      this.cursor_image.setStrokeStyle('blue');
      this.cursor_image.lineTo(x, y);
    }
    this.view_image.closePath();
    this.cursor_image.stroke();
    this.cursor_point.x = x;
    this.cursor_point.y = y;
  }

  get screen(): PinoScreen {
    return this.pino.app.screen;
  }
}
