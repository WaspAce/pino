import { PinoBrowserClient } from '../browser_client';

export class PinoLifeSpanHandler {
  native: LifeSpanHandler;

  private do_on_after_created(
    browser: Browser
  ) {
    this.client.browser_created(browser);
  }

  // private do_on_before_popup(browser: Browser,
  //   frame: Frame,
  //   target_url: string,
  //   target_frame_name: string,
  //   target_disposition: WindowOpenDisposition,
  //   user_gesture: boolean,
  //   popup_features: PopupFeatures,
  //   window_info: WindowInfo,
  //   settings: BrowserSettings
  // ): {
  //   allow: boolean,
  //   client: BrowserClient,
  //   no_javascript_access: boolean
  // } {
  //   const tab = this.client.browser.tab.pino.add_tab();
  //   return {
  //     allow: true,
  //     client: tab.
  //   }
  // }

  private init_native() {
    this.native = new LifeSpanHandler(this);
    this.native.on_after_created = this.do_on_after_created;
    // this.native.on_before_popup = this.do_on_before_popup;
  }

  constructor(
    private readonly client: PinoBrowserClient
  ) {
    this.init_native();
  }
}
