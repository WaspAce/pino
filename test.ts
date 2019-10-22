import { Pino } from './src/pino';

class Test {
  private pino: Pino;

  constructor() {
    this.pino = new Pino({
      gui: true
    });
  }

  async go() {
    await this.pino.init();
    console.log('inited');
    this.pino.screen.screen_info.available_rect.width = 500;
    this.pino.screen_changed();
    const tab = await this.pino.add_tab();
    console.log('tab added');
    await tab.load('https://www.youtube.com/watch?v=vuT_bXzhqhY');
    console.log('loaded');
  }
}

const test = new Test();
test.go();

export default test;
