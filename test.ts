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
    this.pino = new Pino(
      true
    );
  }

  async go() {
    this.app.init();
    await this.pino.init();
    console.log('inited');
    this.pino.screen.screen_info.available_rect.width = 1000;
    this.pino.screen.view_rect.width = 1000;
    this.pino.screen_changed();
    this.tab = await this.pino.add_tab();
    console.log('tab added');
    await this.tab.load('http://tests.wa/wa/iframes.html');
    console.log('loaded');
    this.divs = await this.tab.find_elements('div[class*="element"]');
    for (const div of this.divs) {
      await div.move_to();
      console.log('moved to: ', await div.className);
    }
  }
}

const test = new Test();
test.go().catch(reason => {
  console.log(reason);
});

export default test;
