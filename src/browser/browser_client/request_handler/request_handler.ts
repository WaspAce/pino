import { IPinoRequestHandler } from './request_handler_types';
export class PinoRequestHandler {
  private init_native() {
    const native = new RequestHandler(this.client);
    if (this.client.on_render_process_terminated) {
      native.on_render_process_terminated = this.client.on_render_process_terminated;
    }
    if (this.client.on_before_browse) {
      native.on_before_browse = this.client.on_before_browse;
    }
    this.client.native.request_handler = native;
  }

  constructor(
    private readonly client: IPinoRequestHandler
  ) {
    this.init_native();
  }
}
