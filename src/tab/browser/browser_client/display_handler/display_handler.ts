import { IPinoBrowserClient } from './../browser_client_types';
import { IPinoDisplayHandler } from './display_handler_types';

export class PinoDisplayHandler implements IPinoDisplayHandler {
  native: DisplayHandler;

  private do_on_loading_progress_change(
    browser: Browser,
    progress: number
   ) {
     if (progress === 1 && !browser.is_loading) {
       this.client.page_loaded();
     }
  }

  private init_native() {
    this.native = new DisplayHandler(this);
    this.native.on_loading_progress_change = this.do_on_loading_progress_change;
  }

  constructor(
    private readonly client: IPinoBrowserClient
  ) {
    this.init_native();
  }
}
