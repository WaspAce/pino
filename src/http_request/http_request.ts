export class HttpRequest {

  private xhr: XMLHttpRequest;
  private on_resolve: (value?: any) => void;
  private on_reject: (reason?: any) => void;

  private do_on_load_end() {
    if (this.on_resolve) {
      const resolve = this.on_resolve;
      this.on_resolve = undefined;
      resolve();
    }
  }

  constructor(
    method: string,
    url: string
  ) {
    this.xhr = new XMLHttpRequest(this);
    this.xhr.onloadend = this.do_on_load_end;
    this.xhr.open(method, url, true);
  }

  async send(
    body?: object | string | number[]
  ) {
    return new Promise((resolve, reject) => {
      this.on_resolve = resolve;
      this.on_reject = reject;
      if (typeof body === 'object') {
        this.xhr.send(JSON.stringify(body));
      } else {
        this.xhr.send(body);
      }
    });
  }

  get_response_header(
    key: string
  ): string {
    return this.xhr.getResponseHeader(key);
  }

  get_response_bytes(): number[] {
    return this.xhr.getResponseBytes();
  }

  set_request_header(
    key: string,
    value: string
  ) {
    this.xhr.setRequestHeader(key, value);
  }

  get status(): number {
    return this.xhr.status;
  }

  get status_text(): string {
    return this.xhr.statusText;
  }

  get response_text(): string {
    return this.xhr.responseText;
  }
}
