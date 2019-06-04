export class PinoLoadHandler {
    constructor(client) {
        this.client = client;
        this.counter = 0;
        this.init_native();
    }
    do_on_load_error(browser, frame, error_code, error_text, failed_url) {
        this.counter++;
    }
    do_on_load_start(browser, frame, transition_type) {
        this.counter++;
    }
    do_on_load_end(browser, frame, http_status_code) {
        this.counter--;
        if (!browser.is_loading) {
            this.client.page_loaded();
        }
    }
    init_native() {
        this.native = new LoadHandler(this);
        this.native.on_load_error = this.do_on_load_error;
        this.native.on_load_end = this.do_on_load_end;
        this.native.on_load_start = this.do_on_load_start;
    }
}
