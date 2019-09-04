import { Pino } from './src/pino';

const pino = new Pino({
  gui: true
});

pino.add_tab().then(tab => {
  tab.load('ya.ru').then(() => {
    tab.load('google.ru').then(() => {
      console.log('loaded');
    });
  });
});

export default pino;
