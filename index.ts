import { Pino } from './pino/pino';

const pino = new Pino({
  gui: true,
  loop_interval_ms: 5,
  default_url: 'https://www.youtube.com/watch?v=vuT_bXzhqhY&play=true'
});

pino.load('ya.ru');

export { pino };
