import {Time, UTC} from './scales/types';
import {isDiscrete} from './scales';
import {tickFormat} from './ticks';

function format(scale, specifier, formatType) {
  const type = formatType || scale.type;
  return !specifier && type === Time  ? d => new Date(d).toLocaleString()
    : !specifier && type === UTC ? d => new Date(d).toUTCString()
    : tickFormat(scale, 2, specifier, formatType, true);
}

export function domainCaption(scale, opt) {
  opt = opt || {};
  const max = Math.max(3, opt.maxlen || 10),
        fmt = format(scale, opt.format, opt.formatType),
        d = scale.domain(),
        n = d.length;

  if (isDiscrete(scale.type)) {
    const v = n > max
      ? d.slice(0, max - 2).map(fmt).concat('\u2026', d.slice(-1).map(fmt))
      : d.map(fmt);
    return `${n} discrete value${n !== 1 ? 's' : ''}: ${v.join(', ')}`;
  } else {
    return `values from ${fmt(d[0])} to ${fmt(d[n-1])}`;
  }
}
