/// <reference types="monitor" />
/// <reference types="browser_client" />
/// <reference types="browser_host" />
export declare class PinoGui {
    private readonly client;
    private readonly host;
    private form;
    private view;
    monitor: Monitor;
    private do_on_form_close;
    private create_form;
    private on_view_change_bounds;
    private do_on_view_mouse_wheel;
    private do_on_mouse_down;
    private do_on_mouse_up;
    private do_on_mouse_move;
    private create_view;
    constructor(client: BrowserClient, host: BrowserHost);
}
