import { Pino } from './../../../../../pino';
import { PinoRequestHandler } from './../request_handler';

export class PinoResourceRequestHandler {

  native: ResourceRequestHandler;

  private do_on_before_resource_load(
    browser: Browser,
    frame: Frame,
    request: Request
  ): boolean {
    if (this.pino.on_before_resource_load) {
      return this.pino.on_before_resource_load(browser, frame, request);
    }
    return true;
  }

  private do_on_get_response_filter(
    browser: Browser,
    frame: Frame,
    request: Request,
    response: Response
  ): ResponseFilter {
    if (this.pino.on_get_response_filter) {
      return this.pino.on_get_response_filter(browser, frame, request, response);
    }
  }

  private init_native() {
    this.native = new ResourceRequestHandler(this);
    this.native.on_before_resource_load = this.do_on_before_resource_load;
    this.native.on_get_resource_response_filter = this.do_on_get_response_filter;
  }

  constructor(
    private readonly request_handler: PinoRequestHandler
  ) {
    this.init_native();
  }

  get pino(): Pino {
    return this.request_handler.pino;
  }
}
