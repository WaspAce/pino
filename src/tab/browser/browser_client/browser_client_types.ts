import { PinoRenderHandlerOptions } from './render_handler/render_handler_types';

export interface PinoBrowserClientOptions {
  render_handler?: PinoRenderHandlerOptions;
}

export type UrlFilter = (
  url: string
) => boolean;
