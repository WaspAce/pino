import { Pino } from './src/pino';

const pino = new Pino({
  gui: true
});

pino.add_tab().then(tab => {
  // tab.load('chrome://extensions-support').then(() => {
  setTimeout( _ => {
    tab.load('https://yandex.ru');
  }, 4000);
});

export default pino;
