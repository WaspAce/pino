/// <reference types="life_span_handler" />
import { IPinoBrowserClient } from './../browser_client_types';
import { IPinoLifeSpanHandler } from './life_span_handler_types';
export declare class PinoLifeSpanHandler implements IPinoLifeSpanHandler {
    private readonly client;
    native: LifeSpanHandler;
    private do_on_after_created;
    private init_native;
    constructor(client: IPinoBrowserClient);
}
