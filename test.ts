import { Pino } from './src/pino';

const pino = new Pino({gui: true});
pino.add_tab().then(tab => {
  tab.load('yandex.ru');
});

pino.add_tab().then(tab => {
  tab.load('google.ru');
});

pino.add_tab().then(tab => {
  tab.load('youtube.com').then(() => {
    console.log('youtube loaded');
  });
});

// pino.wait_initialized().then(() => {
//   console.log('initialized');
//   pino.load('dfdslsdfdsfdsfdsfdsfsdfdsfdsfkfjdfdslfjdslkfjkfl.ru').then(() => {
//     console.log('err loaded');
//     pino.load('yandex.ru').then(() => {
//       console.log('yandex loaded');
//       pino.load('youtube.com').then(() => {
//         console.log('youtube loaded');
//       })
//     });
//   });
// });

export default pino;
