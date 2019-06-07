import { Pino } from './src/pino';

const pino = new Pino({
  gui: true
});

pino.add_tab().then(tab => {
  tab.load('example.ru').then(() => {
    console.log('tab loaded');
    tab.execute_js_and_wait_ipc('ololo; transfer_data(true)').catch(reason => {
      console.log(reason);
    });
  });
});

export default pino;
