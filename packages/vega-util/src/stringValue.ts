import isArray from './isArray.js';
import isObject from './isObject.js';
import isString from './isString.js';

/**
 * Converts a value to its string representation.
 * Arrays are formatted as comma-separated values in brackets.
 * Objects and strings are converted to JSON format with Unicode line/paragraph
 * separator characters properly escaped for JavaScript compatibility.
 */
export default function stringValue(x: any): string {
  return isArray(x) ? `[${x.map(v => v === null ? 'null' : stringValue(v))}]`
    : isObject(x) || isString(x) ?
      // Output valid JSON and JS source strings.
      // See https://github.com/judofyr/timeless/blob/master/posts/json-isnt-a-javascript-subset.md
      JSON.stringify(x).replaceAll('\u2028','\\u2028').replaceAll('\u2029', '\\u2029')
    : x;
}
