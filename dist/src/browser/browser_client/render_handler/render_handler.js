export class PinoRenderHandler {
    constructor(client) {
        this.client = client;
        this.init_options();
        this.init_monitor();
        this.init_native();
    }
    init_options() {
        const user_options = this.client.options.render_handler;
        const default_options = {
            use_monitor: false
        };
        if (!user_options) {
            this.options = default_options;
        }
        else {
            this.options = Object.assign(default_options, user_options);
        }
    }
    init_monitor() {
        if (this.options.use_monitor) {
            this.monitor = screen.get_monitor(0);
        }
    }
    do_on_get_screen_point(browser, view_point, screen_point) {
        screen_point.x = view_point.x + this.monitor.x;
        screen_point.y = view_point.y + this.monitor.y;
        return true;
    }
    init_native() {
        this.native = new RenderHandler(this);
        const view_rect = this.client.get_view_rect();
        this.native.root_screen_rect = new Rect();
        this.native.root_screen_rect.copy_from(view_rect);
        this.native.view_rect = new Rect();
        this.native.view_rect.copy_from(view_rect);
        this.native.screen_info = this.client.get_screen_info();
        if (this.monitor) {
            this.native.on_get_screen_point = this.do_on_get_screen_point;
        }
    }
    add_draw_target(target) {
        this.native.add_draw_targets([target]);
    }
    was_resized(view_rect) {
        this.native.view_rect.copy_from(view_rect);
    }
}
