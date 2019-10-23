import { PinoApp } from './src/app/app';
import { Pino } from './src/pino';

class Test {
  private app: PinoApp;
  private pino: Pino;

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
    this.pino.screen.screen_info.available_rect.width = 500;
    this.pino.screen_changed();
    const tab = await this.pino.add_tab();
    console.log('tab added');
    // await tab.load('https://www.youtube.com/watch?v=vuT_bXzhqhY');
    await tab.load('https://whoer.net/extended');
    console.log('loaded');
  }
}

const test = new Test();
test.go().catch(reason => {
  console.log(reason);
});

export default test;
