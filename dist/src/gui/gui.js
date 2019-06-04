export class PinoGui {
    constructor(pino) {
        this.pino = pino;
        this.create_form();
        this.create_view();
        this.on_view_change_bounds(this.view.rect);
    }
    create_form() {
        this.form = new GuiForm(this);
        const rect = screen.get_monitor(0).workarea_rect;
        this.form.caption = 'Pino browser';
        this.form.rect.width = rect.width;
        this.form.rect.height = rect.height;
        this.form.visible = true;
    }
    on_view_change_bounds(rect) {
        this.pino.on_view_resized(rect);
    }
    do_on_view_mouse_wheel(delta, x, y, modifiers) {
        const event = new MouseEvent();
        event.modifiers = modifiers;
        event.x = x;
        event.y = y;
        this.pino.send_mouse_wheel_event(event, delta);
    }
    do_on_mouse_down(button_type, x, y, modifiers) {
        const event = new MouseEvent();
        event.modifiers = modifiers;
        event.x = x;
        event.y = y;
        this.pino.send_mouse_down_event(event, button_type);
    }
    do_on_mouse_up(button_type, x, y, modifiers) {
        const event = new MouseEvent();
        event.modifiers = modifiers;
        event.x = x;
        event.y = y;
        this.pino.send_mouse_up_event(event, button_type);
    }
    do_on_mouse_move(x, y, modifiers) {
        const event = new MouseEvent();
        event.modifiers = modifiers;
        event.x = x;
        event.y = y;
        this.pino.send_mouse_move_event(event);
    }
    do_on_key_press(char) {
        const event = new KeyEvent();
        event.event_type = KeyEventType.KEYEVENT_CHAR;
        event.character = char;
        event.windows_key_code = char.charCodeAt(0);
        this.pino.send_key_press(event);
    }
    do_on_key_down(key_code, modifiers) {
        const event = new KeyEvent();
        event.event_type = KeyEventType.KEYEVENT_RAWKEYDOWN;
        event.windows_key_code = key_code;
        event.modifiers = modifiers;
        this.pino.send_key_down(event);
    }
    do_on_key_up(key_code, modifiers) {
        const event = new KeyEvent();
        event.event_type = KeyEventType.KEYEVENT_RAWKEYDOWN;
        event.windows_key_code = key_code;
        event.modifiers = modifiers;
        this.pino.send_key_up(event);
    }
    create_view() {
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
}
