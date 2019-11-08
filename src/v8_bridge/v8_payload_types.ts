import { PinoV8Value } from './v8_value/v8_value';

export interface PinoV8GetPropertyOptions {
  parent_id: number;
  property_name: string;
}

export interface PinoV8SetPropertyOptions {
  parent_id: number;
  property_name: string;
  value: PinoV8Value;
}

export interface PinoV8CallMethodOptions {
  parent_id: number;
  method_name: string;
}