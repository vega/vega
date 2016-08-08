import {format} from 'd3-format';
import {timeFormat, utcFormat} from 'd3-time-format';

function formatter(method) {
  var cache = {};
  return function(specifier, _) {
    var f = cache[specifier] || (cache[specifier] = method(specifier));
    return f(_);
  };
}

export default function() {
  return {
    format: formatter(format),
    timeFormat: formatter(timeFormat),
    utcFormat: formatter(utcFormat)
  };
}
