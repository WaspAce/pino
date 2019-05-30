import { Pino } from './src/index';

const pino = new Pino({
  gui: true,
  loop_interval_ms: 5,
  load_timeout_ms: 10000
});

pino.load('sdkjfhkdsjfhkjdsfkjdsfhsdfdsf')
  .catch((reason) => {
    pino.load('youtube.com').then(() => {
      pino.load('google.ru').then(() => {
        console.log('load promise TRUE');
      });
    });
  });

export { pino };
