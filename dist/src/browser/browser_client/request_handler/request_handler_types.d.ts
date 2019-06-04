/// <reference types="browser" />
/// <reference types="termination_status" />
/// <reference types="frame" />
/// <reference types="request" />
import { IPinoBrowserClient } from '../browser_client_types';
export declare type OnRenderProcessTerminated = (browser: Browser, status: TerminationStatus) => void;
export declare type OnBeforeBrowse = (browser: Browser, frame: Frame, request: Request, user_gesture: boolean, is_redirect: boolean) => boolean;
export interface IPinoRequestHandler extends IPinoBrowserClient {
    on_render_process_terminated: OnRenderProcessTerminated;
    on_before_browse: OnBeforeBrowse;
}
