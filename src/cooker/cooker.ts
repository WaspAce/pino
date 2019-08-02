import { CookerSetCookieCallback } from './set_cookie_callback/set_cookie_callback';
import { URI, UriScheme } from './../uri/uri';
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
}
