class Misc {
  async sleep(
    timeout_ms: number
  ) {
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, timeout_ms)
    });
  }
}

export const misc = new Misc();