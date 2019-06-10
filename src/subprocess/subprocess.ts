import { PinoSubprocessRenderProcessHandler } from './render_process_handler/render_process_handler';

export class PinoSubprocess {

  initial_scritps: string[] = [];

  private render_process_handler: PinoSubprocessRenderProcessHandler;

  private create_render_process_handler() {
    this.render_process_handler = new PinoSubprocessRenderProcessHandler(this);
    subprocess.render_process_handler = this.render_process_handler.native;
  }

  constructor() {
    this.create_render_process_handler();
    subprocess.start();
  }
}

const sub = new PinoSubprocess();
export { sub };
