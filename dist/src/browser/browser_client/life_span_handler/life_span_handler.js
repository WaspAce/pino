export class PinoLifeSpanHandler {
    constructor(client) {
        this.client = client;
        this.init_native();
    }
    do_on_after_created(browser) {
        this.client.browser_created(browser);
    }
    init_native() {
        this.native = new LifeSpanHandler(this);
        this.native.on_after_created = this.do_on_after_created;
    }
}
