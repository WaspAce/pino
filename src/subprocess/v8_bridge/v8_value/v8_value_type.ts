export enum PinoV8ValueType {
  BOOLEAN,
  INTEGER,
  UINT,
  DOUBLE,
  STRING,
  NULL,
  UNDEFINED,
  ARRAY,
  ARRAY_BUFFER,
  DATE,
  FUNCTION,
  OBJECT
}

export function get_v8_value_type(
  value: V8Value
): PinoV8ValueType {
  if (!value.is_valid || value.is_undefined) {
    return PinoV8ValueType.UNDEFINED;
  } else if (value.is_array) {
    return PinoV8ValueType.ARRAY;
  } else if (value.is_array_buffer) {
    return PinoV8ValueType.ARRAY_BUFFER;
  } else if (value.is_bool) {
    return PinoV8ValueType.BOOLEAN;
  } else if (value.is_date) {
    return PinoV8ValueType.DATE;
  } else if (value.is_double) {
    return PinoV8ValueType.DOUBLE;
  } else if (value.is_function) {
    return PinoV8ValueType.FUNCTION;
  } else if (value.is_int) {
    return PinoV8ValueType.INTEGER;
  } else if (value.is_null) {
    return PinoV8ValueType.NULL;
  } else if (value.is_object) {
    return PinoV8ValueType.OBJECT;
  } else if (value.is_same) {
    return PinoV8ValueType.STRING;
  } else if (value.is_uint) {
    return PinoV8ValueType.UINT;
  }
}

export function get_value_type(
  value: any
): PinoV8ValueType {
  if (value === null) {
    return PinoV8ValueType.NULL;
  }
  switch (typeof value) {
    case 'boolean':
      return PinoV8ValueType.BOOLEAN;
    case 'number':
      if (Number.isInteger(value)) {
        return PinoV8ValueType.INTEGER;
      } else {
        return PinoV8ValueType.DOUBLE;
      }
    case 'string':
      return PinoV8ValueType.STRING;
    case 'object':
      return PinoV8ValueType.OBJECT;
    default:
      return PinoV8ValueType.UNDEFINED;
  }
}
