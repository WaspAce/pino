export class CookerSetCookieCallback {

  native: SetCookieCallback;

  private value = false;
  private completed = false;
  private on_completed: (value: boolean) => void;

  private do_on_complete(
    success: boolean
  ) {
    this.completed = true;
    this.value = success;
    if (this.on_completed) {
      const resolve = this.on_completed;
      this.on_completed = undefined;
      resolve(this.value);
    }
  }

  constructor() {
    this.native = new SetCookieCallback(this);
    this.native.on_complete = this.do_on_complete;
  }

  async wait_for_complete(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      if (this.completed) {
        resolve(this.value);
      } else {
        this.on_completed = resolve;
      }
    });
  }
}
