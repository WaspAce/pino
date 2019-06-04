/// <reference types="render_handler" />
/// <reference types="gui_panel" />
export interface IPinoRenderHandler {
    native: RenderHandler;
    add_draw_target(target: GuiPanel): any;
}
export interface PinoRenderHandlerOptions {
    use_monitor?: boolean;
}
