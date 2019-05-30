class Logger {
    constructor() {
        this.start_time = new Date().getTime();
    }
    log(...values) {
        const date = new Date();
        const pre_message = date.toLocaleDateString() + ' ' +
            date.toLocaleTimeString() + ' ' +
            '(' + (date.getTime() - this.start_time) + ' ms): ';
        console.log(pre_message, ...values);
    }
}
const logger = new Logger();
export { logger };
