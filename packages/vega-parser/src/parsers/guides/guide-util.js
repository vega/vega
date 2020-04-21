import {Bottom, Center, End, Fill, Left, LegendScales, Right, Start, Stroke, Top, Vertical} from './constants';
import {isSignal, value} from '../../util';
import {isDiscrete} from 'vega-scale';
import {isArray, isObject, stringValue} from 'vega-util';

export function lookup(spec, config) {
  const _ = (name, dflt) => value(spec[name], value(config[name], dflt));

  _.isVertical = s => Vertical === value(
    spec.direction,
    config.direction || (s ? config.symbolDirection : config.gradientDirection)
  );

  _.gradientLength = () => value(
    spec.gradientLength,
    config.gradientLength || config.gradientWidth
  );

  _.gradientThickness = () => value(
    spec.gradientThickness,
    config.gradientThickness || config.gradientHeight
  );

  _.entryColumns = () => value(
    spec.columns,
    value(config.columns, +_.isVertical(true))
  );

  return _;
}

export function getEncoding(name, encode) {
  var v = encode && (
    (encode.update && encode.update[name]) ||
    (encode.enter && encode.enter[name])
  );
  return v && v.signal ? v : v ? v.value : null;
}

export function getStyle(name, scope, style) {
  var s = scope.config.style[style];
  return s && s[name];
}

export function anchorExpr(s, e, m) {
  return `item.anchor === "${Start}" ? ${s} : item.anchor === "${End}" ? ${e} : ${m}`;
}

export const alignExpr = anchorExpr(
  stringValue(Left),
  stringValue(Right),
  stringValue(Center)
);

export function tickBand(_) {
  let v = _('tickBand'),
      offset = _('tickOffset'),
      band, extra;

  if (!v) {
    // if no tick band entry, fall back on other properties
    band = _('bandPosition');
    extra = _('tickExtra');
  } else if (v.signal) {
    // if signal, augment code to interpret values
    band = {signal: `(${v.signal})==='extent'?1:0.5`};
    extra = {signal: `(${v.signal})==='extent'?true:false`};
    if (!isObject(offset)) {
      offset = {signal: `(${v.signal})==='extent'?0:${offset}`};
    }
  } else if (v === 'extent') {
    // if constant, simply set values
    band = 1;
    extra = true;
    offset = 0;
  } else {
    band = 0.5;
    extra = false;
  }

  return {extra, band, offset};
}

export function extendOffset(value, offset) {
  return !offset ? value
    : !value ? offset
    : !isObject(value) ? { value, offset }
    : { ...value, offset: extendOffset(value.offset, offset) };
}

export function formatList(list) {
  const n = list.length;
  return n === 0 ? ''
    : n === 1 ? list[0]
    : `${list.slice(0, -1).join(', ')}${n > 2 ? ',' : ''} and ${list[n-1]}`;
}

function wrapFormat(text, format, formatType) {
  if (format == null) return text;
  const func = formatType === 'time' ? 'timeFormat'
    : formatType === 'utc' ? 'utcFormat'
    : 'format';
  return `${func}(${text}, ${isObject(format) && isSignal(format) ? format.signal : `'${format}'`})`;
}

function domainText(scaleType, scaleName, format, formatType) {
  if (isDiscrete(scaleType)) {
    return `represents values " + domain('${scaleName}') + "`;
  } else {
    const lo = wrapFormat(`domain('${scaleName}')[0]`, format, formatType);
    const hi = wrapFormat(`domain('${scaleName}')[1]`, format, formatType);
    return `represents values from " + ${lo} + " to " + ${hi} + "`;
  }
}

function titleText(title) {
  if (isArray(title)) {
    // only use the first row of multiline titles
    title = title[0];
  }
  return title
    ? isObject(title) && isSignal(title)
      ? ` for " + ${title.signal} + "`
      : ` for ${title}`
    : '';
}

function legendTypeText(type) {
  return type + (type === Fill || type === Stroke ? ' color' : '');
}

export function legendAriaLabel(_, scope) {
  const domains = [];
  for (const legendType of LegendScales) {
    const scaleName = _(legendType);
    if (scaleName) {
      const scaleType = scope.scales[scaleName].params.type;
      const domain = domainText(scaleType, scaleName, _('format'), _('formatType') || scaleType);
      domains.push(`${legendTypeText(legendType)} ${domain}`);
    }
  }

  return {
    signal: `"legend${titleText(_('title'))}, ${formatList(domains)}"`
  };
}

export function axisAriaLabel(_, scope) {
  const orient = _('orient');
  const axisType = orient === Bottom || orient === Top ? 'x' : 'y';
  const scaleName = _('scale');
  const scaleType = scope.scales[scaleName].params.type;
  const domain = domainText(scaleType, scaleName, _('format'), _('formatType') || scaleType);

  return {
    signal: `"${axisType} axis${titleText(_('title'))}, ${domain}"`
  };
}
