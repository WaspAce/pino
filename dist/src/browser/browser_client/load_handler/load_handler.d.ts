/// <reference types="load_handler" />
import { IPinoBrowserClient } from './../browser_client_types';
import { IPinoLoadHandler } from './load_handler_types';
export declare class PinoLoadHandler implements IPinoLoadHandler {
    private readonly client;
    native: LoadHandler;
    private counter;
    private do_on_load_error;
    private do_on_load_start;
    private do_on_load_end;
    private init_native;
    constructor(client: IPinoBrowserClient);
}
