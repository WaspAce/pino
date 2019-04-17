import { Pino } from './pino/pino';

const pino = new Pino({
  gui: true,
  loop_interval_ms: 5
});

pino.load('ya.ru');

export { pino };
