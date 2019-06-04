/// <reference types="render_handler" />
/// <reference types="gui_panel" />
/// <reference types="rect" />
import { IPinoBrowserClient } from './../browser_client_types';
import { IPinoRenderHandler } from './render_handler_types';
export declare class PinoRenderHandler implements IPinoRenderHandler {
    private readonly client;
    native: RenderHandler;
    private options;
    private monitor;
    private init_options;
    private init_monitor;
    private do_on_get_screen_point;
    private init_native;
    constructor(client: IPinoBrowserClient);
    add_draw_target(target: GuiPanel): void;
    was_resized(view_rect: Rect): void;
}
