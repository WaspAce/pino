import { PinoBrowserClient } from '../browser_client';

export class PinoDisplayHandler {
  native: DisplayHandler;

  private prev_progress = 0;

  private do_on_loading_progress_change(
    browser: Browser,
    progress: number
   ) {
     if (progress === 1 && (!browser.is_loading || this.prev_progress === 1)) {
       this.client.page_loaded();
     }
     this.prev_progress = progress;
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
