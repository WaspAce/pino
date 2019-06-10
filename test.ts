import { Pino } from './src/pino';

const pino = new Pino({
  gui: true
});

pino.add_tab().then(tab => {
  tab.load('https://www.youtube.com/watch?v=vuT_bXzhqhY&play=true').then(() => {
    console.log('tab loaded');
  });
});

export default pino;
