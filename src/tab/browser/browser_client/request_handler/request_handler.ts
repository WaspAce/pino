import { PinoBrowserClient } from '../browser_client';

export class PinoRequestHandler {

  native: RequestHandler;

  private do_on_before_browse(
    browser: Browser,
    frame: Frame,
    request: Request,
    user_gesture: boolean,
    is_redirect: boolean
  ): boolean {
    if (this.client.browser.tab.pino.options.block_subframes && !frame.is_main) {
      return true;
    }
    return false;
  }

  private init_native() {
    this.native = new RequestHandler(this);
    this.native.on_before_browse = this.do_on_before_browse;
  }

  constructor(
    readonly client: PinoBrowserClient
  ) {
    this.init_native();
  }
}
