import { Pino } from './src/pino';

const pino = new Pino({
  gui: true
});

pino.add_tab().then(tab => {
  tab.load('zhenomaniya.ru').then(() => {
    console.log('tab loaded');
    tab.execute_js_and_wait_ipc('jQuery("body"); transfer_data(true)').then(args => {
      console.log('0 data transferred: ', args.get_type(0));
    });
  });
});

export default pino;
