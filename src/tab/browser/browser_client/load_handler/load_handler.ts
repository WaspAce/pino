import { PinoBrowserClient } from '../browser_client';

export class PinoLoadHandler {

  native: LoadHandler;

  private do_on_load_start(
    browser: Browser,
    frame: Frame,
    transition_type: TransitionType
  ) {
    console.log('load start');
  }

  private do_on_load_error(
    browser: Browser,
    frame: Frame,
    error_code: CefErrorCode,
    error_text: string,
    failed_url: string
  ) {
    console.log('error: ', failed_url);
  }

  private do_on_load_end(
    browser: Browser,
    frame: Frame,
    http_status_code: number
  ) {
    console.log('load end: ', http_status_code);
  }

  private init_native() {
    this.native = new LoadHandler(this);
    this.native.on_load_start = this.do_on_load_start;
    this.native.on_load_error = this.do_on_load_error;
    this.native.on_load_end = this.do_on_load_end;
  }

  constructor(
    readonly client: PinoBrowserClient
  ) {
    this.init_native();
  }
}
