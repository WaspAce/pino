import { IPino } from './../pino_types';
export class PinoGui {
  view: GuiPanel;

  private form: GuiForm;

  private create_form() {
    this.form = new GuiForm(this);
    const rect = screen.get_monitor(0).workarea_rect;
    this.form.caption = 'Pino browser';
    this.form.rect.width = rect.width;
    this.form.rect.height = rect.height;
    this.form.visible = true;
  }

  private on_view_change_bounds(
    rect: Rect
  ) {
    this.pino.on_view_resized(rect);
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
    const event = new MouseEvent();
    event.modifiers = modifiers;
    event.x = x;
    event.y = y;
    this.pino.send_mouse_down_event(event, button_type);
  }

  private do_on_mouse_up(
    button_type: MouseButtonType,
    x: number,
    y: number,
    modifiers: EventFlags[]
  ) {
    const event = new MouseEvent();
    event.modifiers = modifiers;
    event.x = x;
    event.y = y;
    this.pino.send_mouse_up_event(event, button_type);
  }

  private do_on_mouse_move(
    x: number,
    y: number,
    modifiers: EventFlags[]
  ) {
    const event = new MouseEvent();
    event.modifiers = modifiers;
    event.x = x;
    event.y = y;
    this.pino.send_mouse_move_event(event);
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

  private create_view() {
    this.view = new GuiPanel(this.form, this);
    this.view.align = AlignType.alClient;
    this.view.visible = true;
    this.view.on_resize = this.on_view_change_bounds;
    this.view.on_mouse_wheel = this.do_on_view_mouse_wheel;
    this.view.on_mouse_down = this.do_on_mouse_down;
    this.view.on_mouse_up = this.do_on_mouse_up;
    this.view.on_mouse_move = this.do_on_mouse_move;
    this.view.on_key_press = this.do_on_key_press;
    this.view.on_key_down = this.do_on_key_down;
    this.view.on_key_up = this.do_on_key_up;
  }

  constructor(
    private readonly pino: IPino
  ) {
    this.create_form();
    this.create_view();
    this.on_view_change_bounds(this.view.rect);
  }
}
