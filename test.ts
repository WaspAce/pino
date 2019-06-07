import { Pino } from './src/pino';

const pino = new Pino({
  gui: true
});
pino.url_filter = (
  url: string
): boolean => {
  if (url.endsWith('.jpg') || url.endsWith('.png')) {
    return false;
  } else {
    return true;
  }
};

pino.add_tab().then(tab => {
  tab.load('https://pixabay.com/ru/').then(() => {
    console.log('tab loaded');
  });
});

export default pino;
