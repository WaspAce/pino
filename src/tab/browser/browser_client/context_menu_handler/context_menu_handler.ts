import { PinoBrowserClient } from './../browser_client';

export class PinoContextMenuHandler {
  native: ContextMenuHandler;

  private do_on_before_context_menu(
    browser: Browser,
    frame: Frame,
    params: ContextMenuParams,
    model: MenuModel
  ) {
    model.clear();
  }

  private init_native() {
    this.native = new ContextMenuHandler(this);
    this.native.on_before_context_menu = this.do_on_before_context_menu;
  }

  constructor(
    private readonly client: PinoBrowserClient
  ) {
    this.init_native();
  }
}
