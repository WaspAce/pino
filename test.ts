import { Pino } from './src/pino';

const pino = new Pino({
  gui: true
});

pino.add_tab().then(tab => {
  tab.load('chrome://extensions-support').then(() => {
    console.log('tab loaded');
  });
});

export default pino;
