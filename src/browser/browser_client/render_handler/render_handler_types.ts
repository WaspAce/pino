export interface IPinoRenderHandler {
  native: RenderHandler;

  add_draw_target(
    target: GuiPanel
  );
}

export interface PinoRenderHandlerOptions {
  use_monitor?: boolean;
}
