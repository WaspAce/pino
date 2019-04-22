export class PinoGui {
    constructor(client, host) {
        this.client = client;
        this.host = host;
        this.monitor = screen.get_monitor(0);
        this.create_form();
        this.create_view();
        this.client.render_handler.add_draw_targets([this.view]);
        this.on_view_change_bounds(this.view.rect);
    }
    do_on_form_close() {
        system.exit(0, 'Main form closed');
    }
    create_form() {
        this.form = new GuiForm(this);
        this.form.caption = 'Pino main form';
        this.form.rect.width = 1920;
        this.form.rect.height = 600;
        this.form.visible = true;
        this.form.on_close = this.do_on_form_close;
    }
    on_view_change_bounds(rect) {
        this.client.render_handler.view_rect.copy_from(rect);
        this.host.was_resized();
    }
    do_on_view_mouse_wheel(delta, x, y, modifiers) {
        const event = new MouseEvent();
        event.modifiers = modifiers;
        event.x = x;
        event.y = y;
        this.host.send_mouse_wheel_event(event, 0, delta);
    }
    do_on_mouse_down(button_type, x, y, modifiers) {
        const event = new MouseEvent();
        event.modifiers = modifiers;
        event.x = x;
        event.y = y;
        this.host.send_mouse_click_event(event, button_type, false, 1);
    }
    do_on_mouse_up(button_type, x, y, modifiers) {
        const event = new MouseEvent();
        event.modifiers = modifiers;
        event.x = x;
        event.y = y;
        this.host.send_mouse_click_event(event, button_type, true, 1);
    }
    do_on_mouse_move(x, y, modifiers) {
        const event = new MouseEvent();
        event.modifiers = modifiers;
        event.x = x;
        event.y = y;
        this.host.send_mouse_move_event(event, false);
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
    }
}
