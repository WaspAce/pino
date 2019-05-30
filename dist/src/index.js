import { PinoGui } from './gui';
export class Pino {
    constructor(options) {
        this.init_scripts = [];
        this.init_scripts_executed = false;
        this.init_options(options);
        this.init_app();
        this.init_browser();
        this.init_gui();
    }
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
            frame_rate: 60,
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.108 Safari/537.36',
            load_timeout_ms: 30000
        };
        if (!user_options) {
            this.options = default_options;
        }
        else {
            this.options = Object.assign(default_options, user_options);
        }
        if (this.options.init_scripts && this.options.init_scripts.length > 0) {
            this.init_scripts = this.options.init_scripts;
        }
    }
    init_subprocess_info() {
    }
    init_app() {
        CEF_APP.subprocess_source = './subprocess.js';
        this.init_subprocess_info();
        CEF_APP.settings.user_agent = this.options.user_agent;
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
    process_data_transfer(message) {
        if (this.on_js_ipc_resolve) {
            const resolve = this.on_js_ipc_resolve;
            this.on_js_ipc_resolve = undefined;
            this.on_js_ipc_reject = undefined;
            resolve(message.get_argument_list());
        }
    }
    do_on_process_message_received(browser, source_process, message) {
        if (message.name === 'dom_ready') {
        }
        else if (message.name === 'init_scripts_executed') {
            this.init_scripts_executed = true;
            if (this.on_execute_init_scripts) {
                const resolve = this.on_execute_init_scripts;
                this.on_execute_init_scripts = undefined;
                resolve();
            }
        }
        else if (message.name === 'js_exception') {
            this.reject_js_ipc(message.get_argument_list().get_string(0));
        }
        else {
            this.process_data_transfer(message);
        }
    }
    reject_loaded(reason) {
        this.on_loaded_resolve = undefined;
        if (this.on_loaded_reject) {
            const reject = this.on_loaded_reject;
            this.on_loaded_reject = undefined;
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
        this.reject_loaded(reason);
        this.reject_js_ipc(reason);
    }
    do_on_render_process_terminated(browser, status) {
        this.reject_all_wait_promises({
            termination_status: status
        });
    }
    do_on_before_browse(browser, frame, request, user_gesture, is_redirect) {
        if (!frame.is_main && this.options.main_frame_only) {
            return true;
        }
        else {
            return false;
        }
    }
    create_request_handler() {
        this.client.request_handler = new RequestHandler(this);
        this.client.request_handler.on_render_process_terminated = this.do_on_render_process_terminated;
        this.client.request_handler.on_before_browse = this.do_on_before_browse;
    }
    resolve_loaded() {
        if (this.on_loaded_resolve) {
            if (this.on_loaded_interval) {
                clearInterval(this.on_loaded_interval);
                this.on_loaded_interval = undefined;
            }
            const resolve = this.on_loaded_resolve;
            this.on_loaded_resolve = undefined;
            this.on_loaded_reject = undefined;
            this.init_scripts_executed = false;
            this.on_execute_init_scripts = undefined;
            resolve();
        }
    }
    do_on_loading_progress_change(browser, progress) {
        if (progress === 1 && !browser.is_loading) {
            this.resolve_loaded();
        }
    }
    create_display_handler() {
        this.client.display_handler = new DisplayHandler(this);
        this.client.display_handler.on_loading_progress_change = this.do_on_loading_progress_change;
    }
    do_on_load_error(browser, frame, error_code, error_text, failed_url) {
        this.reject_loaded(error_text);
    }
    create_load_handler() {
        this.client.load_handler = new LoadHandler(this);
        this.client.load_handler.on_load_error = this.do_on_load_error;
    }
    create_client() {
        this.client = new BrowserClient(this);
        this.create_render_handler();
        this.create_request_handler();
        this.create_display_handler();
        this.create_load_handler();
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
    start_loading(resolve, reject) {
        if (this.browser.is_loading) {
            this.browser.stop_load();
        }
        this.init_scripts_executed = false;
        this.on_execute_init_scripts = undefined;
        this.on_loaded_resolve = resolve;
        this.on_loaded_reject = reject;
        this.on_loaded_interval = setInterval(_ => {
            this.resolve_loaded();
        }, this.options.load_timeout_ms);
    }
    async execute_init_scripts() {
        if (!this.init_scripts_executed) {
            let merged = '';
            this.init_scripts.forEach(script => {
                merged += script + '\n';
            });
            merged += 'init_scripts_executed();';
            return new Promise(resolve => {
                this.on_execute_init_scripts = resolve;
                this.execute_js(merged);
            });
        }
    }
    async load(url) {
        this.on_loaded_resolve = undefined;
        this.on_loaded_reject = undefined;
        return new Promise((resolve, reject) => {
            if (this.browser.is_loading) {
                this.browser.stop_load();
            }
            this.start_loading(resolve, reject);
            this.browser.get_main_frame().load_url(url);
        });
    }
    execute_js(code) {
        this.browser.get_main_frame().execute_java_script(code, 'http://internal-script.wa', 0);
    }
    async execute_js_and_wait_ipc(code) {
        await this.execute_init_scripts();
        return new Promise((resolve, reject) => {
            this.on_js_ipc_resolve = resolve;
            this.on_js_ipc_reject = reject;
            const try_code = `
        try {
          ${code}
        } catch(e) {
          js_exception(e);
        }
      `;
            this.execute_js(try_code);
        });
    }
    async execute_js_and_wait_dom_ready(code) {
        this.on_loaded_resolve = undefined;
        this.on_loaded_reject = undefined;
        return new Promise((resolve, reject) => {
            this.start_loading(resolve, reject);
            this.execute_js(code);
        });
    }
}
