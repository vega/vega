import {field, isFunction, isObject} from 'vega-util';

function isBuffer(_) {
  return (typeof Buffer === 'function' && isFunction(Buffer.isBuffer))
    ? Buffer.isBuffer(_) : false;
}

export default function(data, format) {
  data = isObject(data) && !isBuffer(data) ? data : JSON.parse(data);
  return (format && format.property)
    ? field(format.property)(data)
    : data;
}
