import { PinoV8ValueType } from './v8_value_type';

export interface PinoV8Value {
  value_type: PinoV8ValueType;
  pool_id?: number;
  value?: any;
}
