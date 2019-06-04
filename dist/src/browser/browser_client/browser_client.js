import { PinoLoadHandler } from './load_handler/load_handler';
import { PinoLifeSpanHandler } from './life_span_handler/life_span_handler';
import { PinoRenderHandler } from './render_handler/render_handler';
export class PinoBrowserClient {
    constructor(browser) {
        this.browser = browser;
        this.init_options();
        this.create_client();
    }
    init_options() {
        const user_options = this.browser.options.client;
        const default_options = {};
        if (!user_options) {
            this.options = default_options;
        }
        else {
            this.options = Object.assign(default_options, user_options);
        }
    }
    create_render_handler() {
        this.render_handler = new PinoRenderHandler(this);
        this.native.render_handler = this.render_handler.native;
    }
    create_life_span_handler() {
        this.life_span_handler = new PinoLifeSpanHandler(this);
        this.native.life_span_handler = this.life_span_handler.native;
    }
    create_load_handler() {
        this.load_handler = new PinoLoadHandler(this);
        this.native.load_handler = this.load_handler.native;
    }
    create_client() {
        this.native = new BrowserClient(this);
        this.create_render_handler();
        this.create_life_span_handler();
        this.create_load_handler();
    }
    browser_created(browser) {
        this.browser.browser_created(browser);
    }
    page_loaded() {
        this.browser.page_loaded();
    }
    get_screen_info() {
        return this.browser.get_screen_info();
    }
    get_view_rect() {
        return this.browser.get_view_rect();
    }
    add_draw_target(target) {
        this.render_handler.add_draw_target(target);
    }
    was_resized(view_rect) {
        this.render_handler.was_resized(view_rect);
    }
}
