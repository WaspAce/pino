import { UriScheme, URI } from './../../../../uri/uri';
import { PinoBrowserClient } from '../browser_client';

export class PinoLoadHandler {

  native: LoadHandler;

  private do_on_load_start(
    browser: Browser,
    frame: Frame,
    transition_type: TransitionType
  ) {
    //
  }

  private do_on_load_end(
    browser: Browser,
    frame: Frame,
    http_status_code: number
  ) {
    //
  }

  private init_native() {
    this.native = new LoadHandler(this);
    this.native.on_load_start = this.do_on_load_start;
    this.native.on_load_end = this.do_on_load_end;
  }

  constructor(
    readonly client: PinoBrowserClient
  ) {
    this.init_native();
  }
}
