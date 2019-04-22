import { PinoGui } from './gui';
export class Pino {
    init_options(user_options) {
        const default_rect = new Rect();
        default_rect.x = 0;
        default_rect.y = 0;
        default_rect.width = 1920;
        default_rect.height = 1080;
        const default_options = {
            gui: false,
            loop_interval_ms: 10,
            aviable_rect: default_rect,
            screen_rect: default_rect,
            view_rect: default_rect,
            frame_rate: 60
        };
        if (!user_options) {
            this.options = default_options;
        }
        else {
            this.options = Object.assign(default_options, user_options);
        }
    }
    init_app() {
        CEF_APP.subprocess_source = './subprocess.js';
        CEF_APP.init();
        CEF_APP.loop_interval_ms = this.options.loop_interval_ms;
        system.gui_loop_interval_ms = this.options.loop_interval_ms;
    }
    init_screen() {
        this.screen_info = new ScreenInfo();
        this.screen_info.available_rect.copy_from(this.options.aviable_rect);
        this.screen_info.rect.copy_from(this.options.screen_rect);
        this.screen_info.depth = 24;
        this.screen_info.depth_per_component = 24;
        this.screen_info.device_scale_factor = 1;
        this.screen_info.is_monochrome = false;
    }
    do_on_get_screen_point(browser, view_point, screen_point) {
        if (this.gui) {
            screen_point.x = view_point.x + this.gui.monitor.x;
            screen_point.y = view_point.y + this.gui.monitor.y;
        }
        else {
            screen_point.x = view_point.x;
            screen_point.y = view_point.y;
        }
        return true;
    }
    create_render_handler() {
        this.client.render_handler = new RenderHandler(this);
        this.client.render_handler.root_screen_rect = new Rect();
        this.client.render_handler.root_screen_rect.x = 0;
        this.client.render_handler.root_screen_rect.y = 0;
        this.client.render_handler.root_screen_rect.width = 1920;
        this.client.render_handler.root_screen_rect.height = 1920;
        this.client.render_handler.view_rect = new Rect();
        this.client.render_handler.view_rect.copy_from(this.options.view_rect);
        this.client.render_handler.screen_info = this.screen_info;
        this.client.render_handler.on_get_screen_point = this.do_on_get_screen_point;
    }
    do_on_load_end(browser, frame, http_code) {
        if (frame.is_main && (http_code > 299 || http_code === 0)) {
            this.reject_dom_ready({
                http_code
            });
        }
    }
    create_load_handler() {
        this.client.load_handler = new LoadHandler(this);
        this.client.load_handler.on_load_end = this.do_on_load_end;
    }
    do_on_process_message_received(browser, source_process, message) {
        if (message.name === 'dom_ready') {
            if (this.on_dom_ready_resolve) {
                const resolve = this.on_dom_ready_resolve;
                this.on_dom_ready_resolve = undefined;
                this.on_dom_ready_reject = undefined;
                resolve();
            }
        }
        else {
            if (this.on_js_ipc_resolve) {
                const resolve = this.on_js_ipc_resolve;
                this.on_js_ipc_resolve = undefined;
                this.on_js_ipc_reject = undefined;
                resolve(message.get_argument_list());
            }
        }
    }
    reject_dom_ready(reason) {
        this.on_dom_ready_resolve = undefined;
        if (this.on_dom_ready_reject) {
            const reject = this.on_dom_ready_reject;
            this.on_dom_ready_reject = undefined;
            reject(reason);
        }
    }
    reject_js_ipc(reason) {
        this.on_js_ipc_resolve = undefined;
        if (this.on_js_ipc_reject) {
            const reject = this.on_js_ipc_reject;
            this.on_js_ipc_reject = undefined;
            reject(reason);
        }
    }
    reject_all_wait_promises(reason) {
        this.reject_dom_ready(reason);
        this.reject_js_ipc(reason);
    }
    do_on_render_process_terminated(browser, status) {
        this.reject_all_wait_promises({
            termination_status: status
        });
    }
    create_request_handler() {
        this.client.request_handler = new RequestHandler(this);
        this.client.request_handler.on_render_process_terminated = this.do_on_render_process_terminated;
    }
    create_client() {
        this.client = new BrowserClient(this);
        this.create_render_handler();
        this.create_load_handler();
        this.create_request_handler();
        this.client.on_process_message_received = this.do_on_process_message_received;
    }
    create_browser() {
        const window_info = new WindowInfo();
        const settings = new BrowserSettings();
        settings.frame_rate = this.options.frame_rate;
        this.browser = new Browser(window_info, this.client, '', settings);
    }
    init_browser() {
        this.init_screen();
        this.create_client();
        this.create_browser();
    }
    init_gui() {
        if (this.options.gui) {
            this.gui = new PinoGui(this.client, this.browser.get_host());
        }
    }
    constructor(options) {
        this.init_options(options);
        this.init_app();
        this.init_browser();
        this.init_gui();
    }
    async load(url) {
        this.on_dom_ready_resolve = undefined;
        this.on_dom_ready_reject = undefined;
        return new Promise((resolve, reject) => {
            if (this.browser.is_loading) {
                this.browser.stop_load();
            }
            this.on_dom_ready_resolve = resolve;
            this.on_dom_ready_reject = reject;
            this.browser.get_main_frame().load_url(url);
        });
    }
    execute_js(code) {
        this.browser.get_main_frame().execute_java_script(code, 'http://internal-script.wa', 0);
    }
    async execute_js_and_wait_ipc(code) {
        return new Promise((resolve, reject) => {
            this.on_js_ipc_resolve = resolve;
            this.on_js_ipc_reject = reject;
            this.execute_js(code);
        });
    }
    async execute_js_and_wait_dom_ready(code) {
        this.on_dom_ready_resolve = undefined;
        this.on_dom_ready_reject = undefined;
        return new Promise((resolve, reject) => {
            if (this.browser.is_loading) {
                this.browser.stop_load();
            }
            this.on_dom_ready_resolve = resolve;
            this.on_dom_ready_reject = reject;
            this.execute_js(code);
        });
    }
}
