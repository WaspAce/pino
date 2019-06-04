export class PinoDisplayHandler {
    constructor(client) {
        this.client = client;
        this.init_native();
    }
    do_on_loading_progress_change(browser, progress) {
        if (progress === 1 && !browser.is_loading) {
            console.log('Loaded by progress');
            this.client.page_loaded();
        }
    }
    init_native() {
        this.native = new DisplayHandler(this);
    }
}
