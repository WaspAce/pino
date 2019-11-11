import { UriScheme } from './../uri/uri';
import {
  CookerCookieCollector,
  ADJUVANT_COOKIE_NAME,
  ADJUVANT_COOKIE_DOMAIN,
  ADJUVANT_COOKIE_VALUE
} from './cookie_collector/cookie_collector';
import { CookerSetCookieCallback } from './set_cookie_callback/set_cookie_callback';
import { URI } from '../uri/uri';

export class Cooker {

  private manager = CEF_APP.get_global_cookie_manager();

  private delete_cookies_callback: DeleteCookiesCallback;
  private on_cookies_delete_resolve: () => void;

  private do_on_cookies_deleted() {
    if (this.on_cookies_delete_resolve) {
      const resolve = this.on_cookies_delete_resolve;
      this.on_cookies_delete_resolve = undefined;
      resolve();
    }
  }

  private async install_adjuvant_cookie() {
    const cookie = new Cookie();
    cookie.domain = ADJUVANT_COOKIE_DOMAIN;
    cookie.name = ADJUVANT_COOKIE_NAME;
    cookie.value = ADJUVANT_COOKIE_VALUE;
    await this.install_cookie(cookie);
  }

  constructor() {
    if (!CEF_APP.initialized) {
      throw new Error('CEF_APP MUST be initialized!');
    }
    this.delete_cookies_callback = new DeleteCookiesCallback(this);
    this.delete_cookies_callback.on_complete = this.do_on_cookies_deleted;
  }

  async clear_cookies() {
    return new Promise((resolve, reject) => {
      this.on_cookies_delete_resolve = resolve;
      if (!this.manager.delete_cookies('', '', this.delete_cookies_callback)) {
        this.on_cookies_delete_resolve = undefined;
        reject('Could not clear cookies');
      }
    });
  }

  async install_cookie(
    cookie: Cookie
  ) {
    let url = cookie.domain;
    if (url.indexOf('.') === 0) {
      url = url.substr(1);
    }
    const uri = new URI(url);
    if (!cookie.secure) {
      uri.scheme = UriScheme.SCHEME_HTTP;
      const callback_http = new CookerSetCookieCallback();
      if (this.manager.set_cookie(uri.stringify(), cookie, callback_http.native)) {
        await callback_http.wait_for_complete();
      }
    }
    if (!cookie.httponly) {
      uri.scheme = UriScheme.SCHEME_HTTPS;
      const callback_https = new CookerSetCookieCallback();
      if (this.manager.set_cookie(uri.stringify(), cookie, callback_https.native)) {
        await callback_https.wait_for_complete();
      }
    }
  }

  async collect_cookies(): Promise<Cookie[]> {
    await this.install_adjuvant_cookie();
    return new Promise<Cookie[]>((resolve, reject) => {
      const collector = new CookerCookieCollector();
      if (!this.manager.visit_all_cookies(collector.native)) {
        reject('Cannot access cookies');
      } else {
        collector.wait_for_cookies().then(cookies => {
          resolve(cookies);
        });
      }
    });
  }
}
