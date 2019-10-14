import { Pino } from './src/pino';

const pino = new Pino({
  gui: true
});

pino.add_tab().then(tab => {
  tab.load('https://jigsaw.w3.org/HTTP/Basic/').then(() => {
  // tab.load('https://yandex.ru').then(() => {
    console.log('loaded');
  });
});

export default pino;
