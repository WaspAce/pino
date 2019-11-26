import { setTimeout } from '../timers/timers';

class Misc {
  async sleep(
    timeout_ms: number
  ) {
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, timeout_ms);
    });
  }

   random_int(
    min: number,
    max: number
  ): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}

export const misc = new Misc();
