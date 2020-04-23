import {labelFormat, labelValues} from './labels';
import {Time, UTC} from './scales/types';
import {isDiscrete, isDiscretizing} from './scales';
import {peek} from 'vega-util';

function format(scale, specifier, formatType) {
  const type = formatType || scale.type;
  return !specifier && type === Time  ? d => new Date(d).toLocaleString()
    : !specifier && type === UTC ? d => new Date(d).toUTCString()
    : labelFormat(scale, 5, null, specifier, formatType, true);
}

export function domainCaption(scale, opt) {
  opt = opt || {};
  const max = Math.max(3, opt.maxlen || 10),
        fmt = format(scale, opt.format, opt.formatType);

  // if scale breaks domain into bins, describe boundaries
  if (isDiscretizing(scale.type)) {
    const v = labelValues(scale).map(fmt),
          n = v.length;
    return `${n} boundar${n === 1 ? 'y' : 'ies'}: ${v.join(', ')}`;
  }

  // if scale domain is discrete, list values
  else if (isDiscrete(scale.type)) {
    const d = scale.domain(),
          n = d.length,
          v = n > max
            ? d.slice(0, max - 2).map(fmt).concat('...', d.slice(-1).map(fmt))
            : d.map(fmt);
    return `${n} value${n === 1 ? '' : 's'}: ${v.join(', ')}`;
  }

  // if scale domain is continuous, describe value range
  else {
    const d = scale.domain();
    return `values from ${fmt(d[0])} to ${fmt(peek(d))}`;
  }
}
