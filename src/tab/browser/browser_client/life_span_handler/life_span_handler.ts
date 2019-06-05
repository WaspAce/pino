import { IPinoBrowserClient } from './../browser_client_types';
import { IPinoLifeSpanHandler } from './life_span_handler_types';

export class PinoLifeSpanHandler implements IPinoLifeSpanHandler {
  native: LifeSpanHandler;

  private do_on_after_created(
    browser: Browser
  ) {
    this.client.browser_created(browser);
  }

  private init_native() {
    this.native = new LifeSpanHandler(this);
    this.native.on_after_created = this.do_on_after_created;
  }

  constructor(
    private readonly client: IPinoBrowserClient
  ) {
    this.init_native();
  }
}
