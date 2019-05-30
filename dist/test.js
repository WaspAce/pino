import { Pino } from './src/index';
const pino = new Pino({
    gui: true,
    loop_interval_ms: 5,
    load_timeout_ms: 10000
});
pino.load('sdkjfhkdsjfhkjdsfkjdsfhsdfdsf')
    .catch((reason) => {
    console.log('load REJECT: ', reason);
    pino.load('youtube.com').then(() => {
        console.log('youtube loaded');
    });
});
export { pino };
