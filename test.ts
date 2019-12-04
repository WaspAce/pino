import { misc } from './src/misc/misc';
import { PinoApp } from './src/app/app';
import { Pino } from './src/pino';
import { PinoTab } from './src/tab/tab';

class Test {
  private app: PinoApp;
  private pino: Pino;

  constructor() {
    this.app = new PinoApp();
    this.app.app_loop_interval_ms = 1;
    this.app.gui_loop_interval_ms = 1;
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
    const tab = await this.pino.add_tab();
    console.log('tab added');
    await tab.load('http://assets.wa/wa/iframes.html');
    console.log('loaded');
    const divs = await tab.find_elements('div[class*="element"]');
    for (const div of divs) {
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
