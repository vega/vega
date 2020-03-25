import {Left, Right, Center, Start, End, Vertical} from './constants';
import {value} from '../../util';
import {isObject, stringValue, isArray} from 'vega-util';
import {Time, UTC} from 'vega-scale';

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

const DISCRETE_SCALES = new Set(['ordinal', 'band', 'point']);

function formatType(_, scaleType) {
  const formatType = _('formatType');

  if (formatType) {
    return formatType;
  }
  if (scaleType === Time) {
    return 'time'
  }
  if (scaleType === UTC) {
    return 'utc'
  }
}

function wrapFormat(text, format, formatType) {
  if (format == null) {
    return text
  }
  const func = formatType === "time" ? "timeFormat" : formatType === "utc" ? "utcFormat" : "format";
  return `${func}(${text}, "${format}")`;
}

function domainText(scaleType, scaleName, format, formatType) {
  return DISCRETE_SCALES.has(scaleType)
    ? ` with values " + domain('${scaleName}')`
    : ` from " + ${wrapFormat(
        `domain("${scaleName}")[0]`,
        format,
        formatType
      )} + " to " + ${wrapFormat(
        `domain("${scaleName}")[1]`,
        format,
        formatType
      )}`;
}

function titleText(_) {
  let title = _('title')

  if (isArray(title)) {
    // only use the first row of multiline titles
    title = title[0];
  }

  if (title) {
    return isObject(title) ? ` showing " + ${title.signal} + "` : ` showing ${title}`;
  }

  return '';
}

export function legendAriaLabel(_, scope) {
  const domains = [];
  for (const legendType of ['fill', 'stroke', 'opacity', 'size', 'shape', 'strokeDash']) {
    const scaleName = _(legendType);
    if (scaleName) {
      const scaleType = scope.scales[scaleName].params.type;
      const domain = domainText(scaleType, scaleName, _('format'), formatType(_, scaleType));
      domains.push(`${domain} + " as ${legendType}`);
    }
  }
  const signal = `"legend${titleText(_)}${domains.join(',')}"`;
  return { signal };
}

export function axisAriaLabel(_, scope) {
  const scaleName = _('scale');
  const scaleType = scope.scales[scaleName].params.type;
  const orient = _('orient')
  const axisType = orient === 'bottom' || orient === 'top' ? 'x' : 'y';
  const domain = domainText(scaleType, scaleName, _('format'), formatType(_, scaleType));
  const signal = `"${axisType} axis${titleText(_)}${domain}`;
  return { signal };
}
