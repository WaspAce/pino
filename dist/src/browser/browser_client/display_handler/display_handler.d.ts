/// <reference types="display_handler" />
import { IPinoBrowserClient } from './../browser_client_types';
import { IPinoDisplayHandler } from './display_handler_types';
export declare class PinoDisplayHandler implements IPinoDisplayHandler {
    private readonly client;
    native: DisplayHandler;
    private do_on_loading_progress_change;
    private init_native;
    constructor(client: IPinoBrowserClient);
}
