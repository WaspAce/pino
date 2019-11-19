import { IPC_TRANSFER_DATA_FUN_NAME } from './src/subprocess/render_process_handler/v8_extension/v8_extension';
import { PinoApp } from './src/app/app';
import { Pino } from './src/pino';
import { PinoTab } from './src/tab/tab';

class Test {
  private app: PinoApp;
  private pino: Pino;
  private tab: PinoTab;
  private divs = [];

  constructor() {
    this.app = new PinoApp();
    this.app.app_loop_interval_ms = 100;
    this.app.gui_loop_interval_ms = 10;
    this.pino = new Pino(
      this.app,
      true
    );
    this.pino.is_mobile = false;
  }

  async go() {
    this.app.init();
    this.pino.app.screen.screen_info.available_rect.width = 1000;
    this.pino.app.screen.view_rect.width = 1000;
    this.pino.app.screen.view_rect.height = 900;
    this.pino.app.screen.root_screen_rect.height = 900;
    this.pino.app.screen.screen_info.available_rect.height = 900;
    this.pino.app.screen.screen_info.rect.height = 900;

    await this.pino.init();
    console.log('inited');

    this.pino.screen_changed();
    this.tab = await this.pino.add_tab();
    console.log('tab added');
    await this.tab.load('http://tests.wa/wa/iframes.html');
    console.log('loaded');
    this.divs = await this.tab.find_elements('div[class*="element"]');
    for (const div of this.divs) {
      console.log('move to: ', await div.className);
      await div.move_to(10000);
    }
  }
}

const test = new Test();
test.go().catch(reason => {
  console.log('TASK ERROR: ', reason.message);
});

export default test;
