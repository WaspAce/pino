import { Pino } from '../pino';
import { PinoScreen } from '../screen/screen';

export class PinoGui {

  view: GuiPanel;
  tabs: GuiTabs;

  private form: GuiForm;
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
      const event = new TouchEvent();
      event.id = 1;
      event.modifiers = modifiers;
      event.pointer_type = PointerType.CEF_POINTER_TYPE_TOUCH;
      event.type_ = TouchEventType.CEF_TET_MOVED;
      event.x = x;
      event.y = y;
      this.pino.send_touch_event(event);
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
    this.pino.send_key_press(event);
  }

  private do_on_key_down(
    key_code: number,
    modifiers: EventFlags[]
  ) {
    const event = new KeyEvent();
    event.event_type = KeyEventType.KEYEVENT_RAWKEYDOWN;
    event.windows_key_code = key_code;
    event.modifiers = modifiers;
    this.pino.send_key_down(event);
  }

  private do_on_key_up(
    key_code: number,
    modifiers: EventFlags[]
  ) {
    const event = new KeyEvent();
    event.event_type = KeyEventType.KEYEVENT_RAWKEYDOWN;
    event.windows_key_code = key_code;
    event.modifiers = modifiers;
    this.pino.send_key_up(event);
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
      if (!this.pino.screen.is_default) {
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

  get screen(): PinoScreen {
    return this.pino.screen;
  }
}
