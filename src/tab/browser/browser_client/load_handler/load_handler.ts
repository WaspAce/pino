import { IPinoBrowserClient } from './../browser_client_types';
import { IPinoLoadHandler } from './load_handler_types';

export class PinoLoadHandler implements IPinoLoadHandler {
  native: LoadHandler;

  private counter = 0;

  // private do_on_load_error(
  //   browser: Browser,
  //   frame: Frame,
  //   error_code: CefErrorCode,
  //   error_text: string,
  //   failed_url: string
  // ) {
  //   this.counter++;
  // }

  // private do_on_load_start(
  //   browser: Browser,
  //   frame: Frame,
  //   transition_type: TransitionType
  // ) {
  //   this.counter++;
  // }

  // private do_on_load_end(
  //   browser: Browser,
  //   frame: Frame,
  //   http_status_code: number
  // ) {
  //   this.counter--;
  //   if (this.counter === 0) {
  //     this.client.frames_loaded();
  //   }
  // }

  private do_on_loading_state_change(
    browser: Browser,
    is_loading: boolean,
    can_go_back: boolean,
    can_go_forward: boolean
  ) {
    if (!is_loading) {
      this.client.frames_loaded();
    }
  }

  private init_native() {
    this.native = new LoadHandler(this);
    // this.native.on_load_error = this.do_on_load_error;
    // this.native.on_load_end = this.do_on_load_end;
    // this.native.on_load_start = this.do_on_load_start;
    this.native.on_loading_state_change = this.do_on_loading_state_change;
  }

  constructor(
    private readonly client: IPinoBrowserClient
  ) {
    this.init_native();
  }

  reset() {
    this.counter = 0;
  }
}
