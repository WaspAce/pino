import { IPinoBrowserClient } from './../browser_client_types';
import { IPinoLoadHandler } from './load_handler_types';

export class PinoLoadHandler implements IPinoLoadHandler {
  native: LoadHandler;

  private counter = 0;

  private do_on_load_error(
    browser: Browser,
    frame: Frame,
    error_code: CefErrorCode,
    error_text: string,
    failed_url: string
  ) {
    this.counter++;
  }

  private do_on_load_start(
    browser: Browser,
    frame: Frame,
    transition_type: TransitionType
  ) {
    this.counter++;
  }

  private do_on_load_end(
    browser: Browser,
    frame: Frame,
    http_status_code: number
  ) {
    this.counter--;
    if (!browser.is_loading) {
      this.client.page_loaded();
    }
  }

  private init_native() {
    this.native = new LoadHandler(this);
    this.native.on_load_error = this.do_on_load_error;
    this.native.on_load_end = this.do_on_load_end;
    this.native.on_load_start = this.do_on_load_start;
  }

  constructor(
    private readonly client: IPinoBrowserClient
  ) {
    this.init_native();
  }
}
