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
    body?: string | number[]
  ) {
    return new Promise((resolve, reject) => {
      this.on_resolve = resolve;
      this.on_reject = reject;
      this.xhr.send(body);
    });
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
