import { PinoBrowserClient } from './browser_client/browser_client';
export class PinoBrowser {
    constructor(pino, create_browser) {
        this.pino = pino;
        this.create_browser = create_browser;
        this.init_options();
        this.init_client();
        this.init_browser();
    }
    init_options() {
        const user_options = this.pino.options.browser;
        const default_options = {
            frame_rate: 30
        };
        if (!user_options) {
            this.options = default_options;
        }
        else {
            this.options = Object.assign(default_options, user_options);
        }
    }
    init_client() {
        this.client = new PinoBrowserClient(this);
    }
    init_browser() {
        if (this.create_browser) {
            const window_info = new WindowInfo();
            const settings = new BrowserSettings();
            settings.frame_rate = this.options.frame_rate;
            const browser = new Browser(window_info, this.client.native, '', settings);
        }
    }
    browser_created(browser) {
        this.native = browser;
        this.host = browser.get_host();
        this.pino.browser_created();
    }
    page_loaded() {
        if (this.on_loaded && !this.native.is_loading) {
            const resolve = this.on_loaded;
            this.on_loaded = undefined;
            resolve();
        }
    }
    get_screen_info() {
        return this.pino.screen_info;
    }
    get_view_rect() {
        return this.pino.get_view_rect();
    }
    add_draw_target(target) {
        this.client.add_draw_target(target);
    }
    was_resized(view_rect) {
        if (this.host) {
            this.host.was_resized();
        }
        this.client.was_resized(view_rect);
    }
    send_mouse_wheel_event(event, delta) {
        if (this.host) {
            this.host.send_mouse_wheel_event(event, 0, delta);
        }
    }
    send_mouse_down_event(event, button) {
        if (this.host) {
            this.host.send_mouse_click_event(event, button, false, 1);
        }
    }
    send_mouse_up_event(event, button) {
        if (this.host) {
            this.host.send_mouse_click_event(event, button, true, 1);
        }
    }
    send_mouse_move_event(event) {
        if (this.host) {
            this.host.send_mouse_move_event(event, false);
        }
    }
    send_key_press(event) {
        if (this.host) {
            this.host.send_key_event(event);
        }
    }
    send_key_down(event) {
        if (this.host) {
            this.host.send_key_event(event);
        }
    }
    send_key_up(event) {
        if (this.host) {
            this.host.send_key_event(event);
        }
    }
    async load(url) {
        this.on_loaded = undefined;
        if (this.native) {
            if (this.native.is_loading) {
                this.native.stop_load();
            }
            return new Promise(resolve => {
                this.on_loaded = resolve;
                this.native.get_main_frame().load_url(url);
            });
        }
    }
}
