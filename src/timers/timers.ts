declare var std_timers: any;

const {
  set_timeout,
  set_interval,
  clear_interval,
  clear_timeout
} = std_timers;

declare type TimeoutHandler = (value?: any) => void;

class Timers {

  handlers_by_timer_id = new Map<number, TimeoutHandler>();

  private do_on_timer(
    timer_id
  ) {
    if (timers.handlers_by_timer_id.has(timer_id)) {
      timers.handlers_by_timer_id.get(timer_id)();
    }
  }

  constructor() {
    std_timers.on_timer = this.do_on_timer;
  }

  set_timeout(
    handler,
    interval
  ) {
    const timer_id = set_timeout(this.do_on_timer, interval);
    this.handlers_by_timer_id.set(timer_id, handler);
    return timer_id;
  }

  set_interval(
    handler,
    interval
  ) {
    const timer_id = set_interval(this.do_on_timer, interval);
    this.handlers_by_timer_id.set(timer_id, handler);
    return timer_id;
  }

  clear_interval(
    timer_id
  ) {
    clear_interval(timer_id);
  }

  clear_timeout(
    timer_id
  ) {
    clear_timeout(timer_id);
  }
}
const timers = new Timers();

export function setTimeout(
  handler: TimeoutHandler,
  interval: number
) {
  return timers.set_timeout(handler, interval);
}

export function setInterval(
  handler: TimeoutHandler,
  interval: number
) {
  return timers.set_interval(handler, interval);
}

export function clearTimeout(
  timer_id: number
) {
  timers.clear_timeout(timer_id);
}

export function clearInterval(
  timer_id: number
) {
  timers.clear_interval(timer_id);
}
