import { PinoBrowserClient } from '../browser_client';

export class PinoRequestHandler {

  native: RequestHandler;

  private do_on_before_resource_load(
    browser: Browser,
    frame: Frame,
    request: Request
  ): boolean {
    if (this.client.browser.tab.pino.url_filter) {
      return this.client.browser.tab.pino.url_filter(request.url);
    } else {
      return true;
    }
  }

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
    this.native.on_before_resource_load = this.do_on_before_resource_load;
    this.native.on_before_browse = this.do_on_before_browse;
  }

  constructor(
    readonly client: PinoBrowserClient
  ) {
    this.init_native();
  }
}
