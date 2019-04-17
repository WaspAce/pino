import { Pino } from './index';

const pino = new Pino({
  gui: true,
  loop_interval_ms: 5
});

pino.load('sdkjfhkdsjfhkjdsfkjdsfhsdfdsf')
  .catch(() => {
    pino.load('youtube.com').then(() => {
      pino.load('google.ru').then(() => {
        console.log('load promise TRUE');
      });
    });
  });

export { pino };
