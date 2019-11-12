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
    this.pino = new Pino(
      true
    );
    this.pino.is_mobile = false;
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
    await this.tab.load('http://tests.wa/wa/events.html');
    console.log('loaded');
    const value = await this.tab.browser.get_main_frame().eval_and_wait_data(`${IPC_TRANSFER_DATA_FUN_NAME}("eval_and_wait_test")`);
    console.log('eval result: ', value);
    // this.divs = await this.tab.find_elements('div[class*="element"]');
    // for (const div of this.divs) {
    //   await div.move_to();
    //   console.log('moved to: ', await div.className);
    // }
    const inputs = await this.tab.find_elements('input');
    await inputs[0].click();
    console.log('clicked');
  }
}

const test = new Test();
test.go().catch(reason => {
  console.log(reason);
});

export default test;
