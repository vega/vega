import {Bottom, Center, End, Left, LegendScales, Right, Start, Top, Vertical} from './constants';
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

function interpretableLegendType(legendType) {
  switch (legendType) {
    case 'fill':
      return 'fill color';
    case 'stroke':
      return 'stroke color';
    default:
      return legendType;
  }
}

export function formatList(list) {
  if (list.length === 0) {
    return '';
  }
  if (list.length === 1) {
    return list[0];
  }
  return `${list.slice(0, list.length-1).join(',')}${list.length > 2 ? ',' : ''} and${list[list.length-1]}`;
}

function wrapFormat(text, format, formatType) {
  if (format == null) return text;
  const func = formatType === 'time' ? 'timeFormat' : formatType === 'utc' ? 'utcFormat' : 'format';
  return `${func}(${text}, ${isObject(format) && isSignal(format) ? format.signal : `"${format}"`})`;
}

function domainText(scaleType, scaleName, format, formatType) {
  return ' represents values ' + (isDiscrete(scaleType)
    ? `" + domain('${scaleName}')`
    : `from " + ${wrapFormat(
        `domain("${scaleName}")[0]`,
        format,
        formatType
      )} + " to " + ${wrapFormat(
        `domain("${scaleName}")[1]`,
        format,
        formatType
      )}`);
}

function titleText(title) {
  if (isArray(title)) {
    // only use the first row of multiline titles
    title = title[0];
  }

  if (title) {
    return isObject(title) && isSignal(title) ? ` for " + ${title.signal} + "` : ` for ${title}`;
  }

  return '';
}

export function legendAriaLabel(_, scope) {
  const domains = [];
  for (const legendType of LegendScales) {
    const scaleName = _(legendType);
    if (scaleName) {
      const scaleType = scope.scales[scaleName].params.type;
      const domain = domainText(scaleType, scaleName, _('format'), _('formatType') || scaleType);
      domains.push(` ${interpretableLegendType(legendType)}${domain} + "`);
    }
  }
  const signal = `"legend${titleText(_('title'))},${formatList(domains)}"`;
  return { signal };
}

export function axisAriaLabel(_, scope) {
  const scaleName = _('scale');
  const scaleType = scope.scales[scaleName].params.type;
  const orient = _('orient');
  const axisType = orient === Bottom || orient === Top ? 'x' : 'y';
  const domain = domainText(scaleType, scaleName, _('format'), _('formatType') || scaleType);
  const signal = `"${axisType} axis${titleText(_('title'))},${domain}`;
  return { signal };
}
