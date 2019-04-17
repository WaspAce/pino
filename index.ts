import { Pino } from './pino/pino';

const pino = new Pino({
  gui: true,
  loop_interval_ms: 5,
  default_url: 'https://ya.ru'
});

export { pino };
