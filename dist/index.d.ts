/// <reference types="list_value" />
import { PinoOptions } from './options';
export declare class Pino {
    private options;
    private screen_info;
    private client;
    private browser;
    private gui;
    private on_js_ipc_resolve;
    private on_js_ipc_reject;
    private on_dom_ready_resolve;
    private on_dom_ready_reject;
    private init_options;
    private init_app;
    private init_screen;
    private do_on_get_screen_point;
    private create_render_handler;
    private do_on_load_end;
    private create_load_handler;
    private do_on_process_message_received;
    private reject_dom_ready;
    private reject_js_ipc;
    private reject_all_wait_promises;
    private do_on_render_process_terminated;
    private create_request_handler;
    private create_client;
    private create_browser;
    private init_browser;
    private init_gui;
    constructor(options?: PinoOptions);
    load(url: string): Promise<{}>;
    execute_js(code: string): void;
    execute_js_and_wait_ipc(code: string): Promise<ListValue>;
    execute_js_and_wait_dom_ready(code: string): Promise<{}>;
}
