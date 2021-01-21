import {field, isArray} from 'vega-util';

// memoize accessor functions
const accessors = {};

export default function(data, name) {
  const accessor = accessors[name] || (accessors[name] = field(name));
  return isArray(data) ? data.map(accessor) : accessor(data);
}
