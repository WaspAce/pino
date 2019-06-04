import { PinoGui } from './gui/gui';
import { PinoBrowser } from './browser/browser';
export class Pino {
    get_default_rect() {
        const result = new Rect();
        result.x = 0;
        result.y = 0;
        result.width = 1920;
        result.height = 1080;
        return result;
    }
    init_options(user_options) {
        const default_options = {
            gui: false,
            screen: {
                color_depth: 24,
                device_scale_factor: 1,
                is_monochrome: false
            },
            browser: {
                client: {
                    render_handler: {}
                }
            }
        };
        if (!user_options) {
            this.options = default_options;
        }
        else {
            this.options = Object.assign(default_options, user_options);
        }
        if (this.options.gui) {
            this.options.browser.client.render_handler.use_monitor = true;
        }
    }
    init_screen_info() {
        this.screen_info = new ScreenInfo();
        let monitor;
        const default_rect = this.get_default_rect();
        if (this.options.gui) {
            monitor = screen.get_monitor(0);
        }
        if (this.options.screen && this.options.screen.rect) {
            this.screen_info.rect.copy_from(this.options.screen.rect);
        }
        else if (this.options.gui) {
            this.screen_info.rect.copy_from(monitor.bounds_rect);
        }
        else {
            this.screen_info.rect.copy_from(default_rect);
        }
        if (this.options.screen && this.options.screen.available_rect) {
            this.screen_info.available_rect.copy_from(this.options.screen.available_rect);
        }
        else if (this.options.gui) {
            this.screen_info.available_rect.copy_from(monitor.workarea_rect);
        }
        else {
            this.screen_info.available_rect.copy_from(default_rect);
        }
        this.screen_info.depth = this.options.screen.color_depth;
        this.screen_info.depth_per_component = this.options.screen.color_depth;
        this.screen_info.device_scale_factor = this.options.screen.device_scale_factor;
        this.screen_info.is_monochrome = this.options.screen.is_monochrome;
    }
    create_browser(create_browser) {
        this.browser = new PinoBrowser(this, create_browser);
    }
    create_gui() {
        if (this.options.gui) {
            this.gui = new PinoGui(this);
        }
    }
    resolve_initialized() {
        if (this.on_initialized) {
            const resolve = this.on_initialized;
            this.on_initialized = undefined;
            resolve();
        }
    }
    constructor(user_options, create_browser) {
        this.init_options(user_options);
        this.init_screen_info();
        this.create_gui();
        this.create_browser(create_browser);
    }
    on_view_resized(view_rect) {
        if (this.browser) {
            this.browser.was_resized(view_rect);
        }
    }
    send_mouse_wheel_event(event, delta) {
        if (this.browser) {
            this.browser.send_mouse_wheel_event(event, delta);
        }
    }
    send_mouse_down_event(event, button) {
        if (this.browser) {
            this.browser.send_mouse_down_event(event, button);
        }
    }
    send_mouse_up_event(event, button) {
        if (this.browser) {
            this.browser.send_mouse_up_event(event, button);
        }
    }
    send_mouse_move_event(event) {
        if (this.browser) {
            this.browser.send_mouse_move_event(event);
        }
    }
    send_key_press(event) {
        if (this.browser) {
            this.browser.send_key_press(event);
        }
    }
    send_key_down(event) {
        if (this.browser) {
            this.browser.send_key_down(event);
        }
    }
    send_key_up(event) {
        if (this.browser) {
            this.browser.send_key_up(event);
        }
    }
    get_screen_info() {
        return this.screen_info;
    }
    get_view_rect() {
        if (this.gui) {
            return this.gui.view.rect;
        }
    }
    browser_created() {
        if (this.gui) {
            this.browser.add_draw_target(this.gui.view);
        }
        this.resolve_initialized();
    }
    async wait_initialized() {
        return new Promise(resolve => {
            this.on_initialized = resolve;
            if (this.browser.native) {
                this.resolve_initialized();
            }
        });
    }
    async load(url) {
        await this.browser.load(url);
    }
}
