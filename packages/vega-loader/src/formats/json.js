import {
  field, identity, isArray, isFunction, isIterable, isObject
} from 'vega-util';

function isBuffer(_) {
  return (typeof Buffer === 'function' && isFunction(Buffer.isBuffer))
    ? Buffer.isBuffer(_) : false;
}

export default function json(data, format) {
  const prop = (format && format.property) ? field(format.property) : identity;
  return isObject(data) && !isBuffer(data)
    ? parseJSON(prop(data), format)
    : prop(JSON.parse(data));
}

json.responseType = 'json';

function parseJSON(data, format) {
  if (!isArray(data) && isIterable(data)) {
    data = [...data];
  }
  return (format && format.copy)
    ? JSON.parse(JSON.stringify(data))
    : data;
}
