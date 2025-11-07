import isArray from './isArray.js';
import isObject from './isObject.js';
import isString from './isString.js';

export default function $(x) {
  return isArray(x) ? `[${x.map(v => v === null ? 'null' : $(v))}]`
    : isObject(x) || isString(x) ?
      // Output valid JSON and JS source strings.
      // See https://github.com/judofyr/timeless/blob/master/posts/json-isnt-a-javascript-subset.md
      JSON.stringify(x).replaceAll('\u2028','\\u2028').replaceAll('\u2029', '\\u2029')
    : x;
}
