class Logger {
  log(
    ...values: any[]
  ) {
    const date = new Date();
    const pre_message = date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + ': ';
    console.log(pre_message, ...values);
  }
}

const logger = new Logger();

export { logger };
