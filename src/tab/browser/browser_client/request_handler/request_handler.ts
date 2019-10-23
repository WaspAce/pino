import { Pino } from './../../../../pino';
import { PinoBrowserClient } from '../browser_client';

export class PinoRequestHandler {

  native: RequestHandler;

  private do_on_before_browse(
    browser: Browser,
    frame: Frame,
    request: Request,
    user_gesture: boolean,
    is_redirect: boolean
  ): boolean {
    if (this.pino.block_subframes && !frame.is_main) {
      return true;
    }
    return false;
  }

  private do_on_auth_credentials(
    browser: Browser,
    origin_url: string,
    is_proxy: boolean,
    host: string,
    port: string,
    realm: string,
    scheme: string
  ): {
    username: string;
    password: string;
  } {
    if (this.client.browser.tab.pino.on_get_auth_credentials) {
      return this.client.browser.tab.pino.on_get_auth_credentials(
        browser,
        origin_url,
        is_proxy,
        host,
        port,
        realm,
        scheme
      );
    } else {
      return undefined;
    }
  }

  private init_native() {
    this.native = new RequestHandler(this);
    this.native.on_before_browse = this.do_on_before_browse;
    this.native.on_get_auth_credentials = this.do_on_auth_credentials;
  }

  constructor(
    readonly client: PinoBrowserClient
  ) {
    this.init_native();
  }

  get pino(): Pino {
    return this.client.pino;
  }
}
