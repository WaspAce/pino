import { PinoBrowserClient } from '../browser_client';

export class PinoLoadHandler {

  native: LoadHandler;

  private do_on_load_start(
    browser: Browser,
    frame: Frame,
    transition_type: TransitionType
  ) {}

  private do_on_load_error(
    browser: Browser,
    frame: Frame,
    error_code: CefErrorCode,
    error_text: string,
    failed_url: string
  ) {}

  private init_native() {
    this.native = new LoadHandler(this);
    this.native.on_load_start = this.do_on_load_start;
    this.native.on_load_error = this.do_on_load_error;
  }

  constructor(
    readonly client: PinoBrowserClient
  ) {
    this.init_native();
  }
}
