import { Pino } from './src/pino';

CEF_APP.init();
CEF_APP.loop_interval_ms = 5;
system.gui_loop_interval_ms = 5;

const pino = new Pino({
  gui: true
}, true);

pino.wait_initialized().then(() => {
  console.log('initialized');
  pino.load('dfdslsdfdsfdsfdsfdsfsdfdsfdsfkfjdfdslfjdslkfjkfl.ru').then(() => {
    console.log('err loaded');
    pino.load('yandex.ru').then(() => {
      console.log('yandex loaded');
      pino.load('youtube.com').then(() => {
        console.log('youtube loaded');
      })
    });
  });
});

export default pino;
