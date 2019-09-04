export const ADJUVANT_COOKIE_NAME = 'ale_adjuvant_cookie_' + Math.random().toString(36).substr(2, 9);
export const ADJUVANT_COOKIE_DOMAIN = 'ale_adjuvant_cookie_domain_' + Math.random().toString(36).substr(2, 9) + '.com';
export const ADJUVANT_COOKIE_VALUE = 'ale_adjuvant_cookie_value_' + Math.random().toString(36).substr(2, 9);

export class CookerCookieCollector {

  native: CookieVisitor;

  private on_collect_cookies_resolve: (value: Cookie[]) => void;
  private cookies: Cookie[] = [];

  private do_on_cookie_visit(
    cookie: Cookie,
    count: number,
    total: number
  ): boolean {
    if (cookie.name !== ADJUVANT_COOKIE_NAME) {
      this.cookies.push(cookie.clone());
    }
    if (count === total - 1 && this.on_collect_cookies_resolve) {
      const resolve = this.on_collect_cookies_resolve;
      this.on_collect_cookies_resolve = undefined;
      resolve(this.cookies);
    }
    return (cookie.name === ADJUVANT_COOKIE_NAME);
  }

  constructor() {
    this.native = new CookieVisitor(this);
    this.native.on_visit = this.do_on_cookie_visit;
  }

  async wait_for_cookies(): Promise<Cookie[]> {
    return new Promise<Cookie[]>(resolve => {
      this.on_collect_cookies_resolve = resolve;
    });
  }
}
