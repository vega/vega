import {labelFormat, labelValues} from './labels.js';
import {Time, UTC} from './scales/types.js';
import {isDiscrete, isDiscretizing, isTemporal} from './scales.js';
import {isString, peek} from 'vega-util';

function format(locale, scale, specifier, formatType) {
  const type = formatType || scale.type;

  // replace abbreviated time specifiers to improve screen reader experience
  if (isString(specifier) && isTemporal(type)) {
    specifier = specifier.replace(/%a/g, '%A').replace(/%b/g, '%B');
  }

  return !specifier && type === Time  ? locale.timeFormat('%A, %d %B %Y, %X')
    : !specifier && type === UTC ? locale.utcFormat('%A, %d %B %Y, %X UTC')
    : labelFormat(locale, scale, 5, null, specifier, formatType, true);
}

/**
 * Generate a domain caption for accessibility labels.
 * @param locale - The number/time formatting locale
 * @param scale - The scale instance
 * @param {object} [opt] - Options (maxlen, format, formatType)
 * @param {Record<string, string>} [ariaLoc] - Aria locale strings for i18n
 * @param {function} [formatStr] - The formatString utility function
 * @param {function} [pluralKey] - The selectPluralKey utility function
 * @returns {string}
 */
export function domainCaption(locale, scale, opt, ariaLoc, formatStr, pluralKey) {
  opt = opt || {};
  const max = Math.max(3, opt.maxlen || 7),
        fmt = format(locale, scale, opt.format, opt.formatType);

  // When no aria locale is provided, use original hardcoded English strings
  if (!ariaLoc || !formatStr) {
    if (isDiscretizing(scale.type)) {
      const v = labelValues(scale).slice(1).map(fmt),
            n = v.length;
      return `${n} boundar${n === 1 ? 'y' : 'ies'}: ${v.join(', ')}`;
    } else if (isDiscrete(scale.type)) {
      const d = scale.domain(),
            n = d.length,
            v = n > max
              ? d.slice(0, max - 2).map(fmt).join(', ')
                + ', ending with ' + d.slice(-1).map(fmt)
              : d.map(fmt).join(', ');
      return `${n} value${n === 1 ? '' : 's'}: ${v}`;
    } else {
      const d = scale.domain();
      return `values from ${fmt(d[0])} to ${fmt(peek(d))}`;
    }
  }

  const languageTag = ariaLoc['languageTag'] || 'en';

  // if scale breaks domain into bins, describe boundaries
  if (isDiscretizing(scale.type)) {
    const v = labelValues(scale).slice(1).map(fmt),
          n = v.length;
    const key = pluralKey('domainBoundaries', n, languageTag, ariaLoc);
    return formatStr(ariaLoc[key], n, v.join(', '));
  }

  // if scale domain is discrete, list values
  if (isDiscrete(scale.type)) {
    const d = scale.domain(),
          n = d.length;

    let valueStr;
    if (n > max) {
      const head = d.slice(0, max - 2).map(fmt).join(', ');
      const tail = d.slice(-1).map(fmt)[0];
      valueStr = formatStr(ariaLoc['domainDiscreteOverflow'], head, tail);
    } else {
      valueStr = d.map(fmt).join(', ');
    }

    const key = pluralKey('domainValues', n, languageTag, ariaLoc);
    return formatStr(ariaLoc[key], n, valueStr);
  }

  // if scale domain is continuous, describe value range
  const d = scale.domain();
  return formatStr(ariaLoc['domainContinuous'], fmt(d[0]), fmt(peek(d)));
}
