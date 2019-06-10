import { Pino } from './../pino';
import { PinoTab } from '../tab/tab';

export class PinoExtensionHandler {

  native: ExtensionHandler;

  private on_loaded: (value?: Extension | PromiseLike<Extension>) => void;
  private on_load_failed: (reason: CefErrorCode) => void;

  private resolve_loaded(
    extension: Extension
  ) {
    this.on_load_failed = undefined;
    if (this.on_loaded) {
      const resolve = this.on_loaded;
      this.on_loaded = undefined;
      resolve(extension);
    }
  }

  private reject_loaded(
    reason: CefErrorCode
  ) {
    this.on_loaded = undefined;
    if (this.on_load_failed) {
      const reject = this.on_load_failed;
      this.on_load_failed = undefined;
      reject(reason);
    }
  }

  private do_on_extension_load_failed(
    result: CefErrorCode
  ): void {
    this.reject_loaded(result);
  }

  private do_on_extension_loaded(
    extension: Extension
  ): void {
    this.resolve_loaded(extension);
  }

  private do_on_extension_unloaded(
    extension: Extension
  ): void {
    console.log('extension unloaded: ', extension.identifier);
  }

  private do_on_before_background_browser(
    extension: Extension,
    url: string,
    settings: BrowserSettings
  ): BrowserClient | null {
    console.log('befroe background browser: ', url);
    const tab = new PinoTab(this.pino, false);
    return tab.browser.client.native;
  }

  private do_on_before_browser(
    extension: Extension,
    browser: Browser,
    active_browser: Browser,
    index: number,
    url: string,
    active: boolean,
    window_info: WindowInfo,
    settings: BrowserSettings
  ): BrowserClient | null {
    console.log('before browser: ', extension.identifier);
    return null;
  }

  private do_on_get_active_browser(
    extension: Extension,
    browser: Browser,
    include_incognito: boolean
  ): Browser | null {
    console.log('get active browser: ', extension.identifier);
    return null;
  }

  private do_on_can_access_browser(
    extension: Extension,
    browser: Browser,
    include_incognito: boolean,
    target_browser: Browser
  ): boolean {
    console.log('can access browser: ', extension.identifier);
    return true;
  }

  private do_on_get_extension_resource(
    extension: Extension,
    browser: Browser,
    file: string,
    callback: GetExtensionResourceCallback
  ): boolean {
    console.log('get extension resource: ', extension.identifier);
    return true;
  }

  private init_native() {
    this.native = new ExtensionHandler(this);
    this.native.on_before_background_browser = this.do_on_before_background_browser;
    this.native.on_before_browser = this.do_on_before_browser;
    this.native.on_can_access_browser = this.do_on_can_access_browser;
    this.native.on_extension_load_failed = this.do_on_extension_load_failed;
    this.native.on_extension_loaded = this.do_on_extension_loaded;
    this.native.on_extension_unloaded = this.do_on_extension_unloaded;
    this.native.on_get_active_browser = this.do_on_get_active_browser;
    this.native.on_get_extension_resource = this.do_on_get_extension_resource;
  }

  constructor(
    readonly pino: Pino
  ) {
    this.init_native();
  }

  async wait_extension_loaded(): Promise<Extension> {
    return new Promise((resolve, reject) => {
      this.on_loaded = resolve;
      this.on_load_failed = reject;
    });
  }
}
