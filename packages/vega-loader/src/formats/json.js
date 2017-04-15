import {field, identity, isFunction, isObject} from 'vega-util';

function isBuffer(_) {
  return (typeof Buffer === 'function' && isFunction(Buffer.isBuffer))
    ? Buffer.isBuffer(_) : false;
}

export default function(data, format) {
  var prop = (format && format.property) ? field(format.property) : identity;
  return isObject(data) && !isBuffer(data)
    ? parseJSON(prop(data))
    : prop(JSON.parse(data));
}

function parseJSON(data, format) {
  return (format && format.copy)
    ? JSON.parse(JSON.stringify(data))
    : data;
}
