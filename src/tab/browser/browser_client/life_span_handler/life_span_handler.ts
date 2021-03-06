import { Pino } from './../../../../pino';
import { PinoBrowserClient } from '../browser_client';

export class PinoLifeSpanHandler {
  native: LifeSpanHandler;

  private do_on_after_created(
    browser: Browser
  ) {
    this.client.browser_created(browser);
  }

  private do_on_before_popup(
    browser: Browser,
    frame: Frame,
    target_url: string,
    target_frame_name: string,
    target_disposition: WindowOpenDisposition,
    user_gesture: boolean,
    popup_features: PopupFeatures,
    window_info: WindowInfo,
    settings: BrowserSettings
  ): {
    allow: boolean,
    client: BrowserClient,
    no_javascript_access: boolean,
    extra_info?: DictionaryValue
  } {
    return {
      allow: true,
      client: this.pino.active_tab.browser.client.native,
      no_javascript_access: false
    };
  }

  private init_native() {
    this.native = new LifeSpanHandler(this);
    this.native.on_after_created = this.do_on_after_created;
    this.native.on_before_popup = this.do_on_before_popup;
  }

  constructor(
    private readonly client: PinoBrowserClient
  ) {
    this.init_native();
  }

  get pino(): Pino {
    return this.client.pino;
  }
}
