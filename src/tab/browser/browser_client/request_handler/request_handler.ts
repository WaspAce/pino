import { IPinoBrowserClient } from './../browser_client_types';
import { IPinoRequestHandler } from './request_handler_types';

export class PinoRequestHandler implements IPinoRequestHandler {

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

  private init_native() {
    this.native = new RequestHandler(this);
    this.native.on_before_resource_load = this.do_on_before_resource_load;
  }

  constructor(
    readonly client: IPinoBrowserClient
  ) {
    this.init_native();
  }
}
