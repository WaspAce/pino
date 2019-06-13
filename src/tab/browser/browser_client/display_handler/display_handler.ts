import { PinoBrowserClient } from '../browser_client';

export class PinoDisplayHandler {
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
    private readonly client: PinoBrowserClient
  ) {
    this.init_native();
  }
}
