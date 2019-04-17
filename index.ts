import { Pino } from './pino/pino';

const pino = new Pino({
  gui: true,
  loop_interval_ms: 5
});

pino.load('ya.ru').then(() => {
  pino.load('google.ru').then(() => {
    pino.load('sdkjfhkdsjfhkjdsfkjdsfhsdfdsf')
      .catch(() => {
        console.log('load promise TRUE');
      });
  });
});

export { pino };
