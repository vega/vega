import {isArray, isDate, isObject} from 'vega-util';

export default function(handler, event, item, value) {
  const el = handler.element();
  if (el) el.setAttribute('title', formatTooltip(value));
}

function formatTooltip(value) {
  return value == null ? ''
    : isArray(value) ? formatArray(value)
    : isObject(value) && !isDate(value) ? formatObject(value)
    : value + '';
}

function formatObject(obj) {
  var kv_list = [];
  var sort_tooltip = undefined
  Object.keys(obj).forEach(key => {
    // Handle sort placeholder.
    if (key === "tooltip_sort_placeholder") {
      sort_tooltip = obj[key];
      return;
    }

    const v = obj[key];
    // Hide undefined values, to be consistent with vega-tooltip's behaviors.
    if (v !== undefined) {
      const kv = [key, v];
      kv_list.push(kv)
    }
  })
  // Sort tooltip if specified.
  if (sort_tooltip !== undefined) {
    const order = sort_tooltip === "0" ? 1 : -1; // order = 1: ascending, order = -1: descending
    kv_list = kv_list.sort((n1,n2) => order * (n1[1] - n2[1])); // Sort by values.
  }
  //kv_list.push(key + ': ' + (isArray(v) ? formatArray(v) : formatValue(v)));
  return kv_list.map(kv => {
    return kv[0] + ': ' + (isArray(kv[1]) ? formatArray(kv[1]) : formatValue(kv[1]));
  }).join('\n');
}

function formatArray(value) {
  return '[' + value.map(formatValue).join(', ') + ']';
}

function formatValue(value) {
  return isArray(value) ? '[\u2026]'
    : isObject(value) && !isDate(value) ? '{\u2026}'
    : value;
}