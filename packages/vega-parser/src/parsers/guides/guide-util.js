import {Left, Right, Center, Start, End, Vertical} from './constants';
import {value} from '../../util';
import {isObject, stringValue, isArray} from 'vega-util';

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

function domainText(scaleType, scaleName) {
  return DISCRETE_SCALES.has(scaleType)
    ? ` with values " + domain('${scaleName}')`
    : ` from " + domain("${scaleName}")[0] + " to " + domain("${scaleName}")[1]`;
}

function titleText(title) {
  if (isArray(title)) {
    // only use the first row of multiline titles
    title = title[0];
  }

  if (title) {
    return isObject(title) ? ` showing " + ${title.signal} + "` : ` showing ${title}`;
  }

  return '';
}

export function legendAriaLabel(spec, scope) {
  const domains = [];
  for (const legendType of ['fill', 'stroke', 'opacity', 'size', 'shape', 'strokeDash']) {
    const scaleName = spec[legendType];
    if (scaleName) {
      const scale = scope.scales[scaleName];
      domains.push(`${domainText(scale.params.type, scaleName)} + " as ${legendType}`);
    }
  }
  const signal = `"legend${titleText(spec.title)}${domains.join(',')}"`;
  return { signal };
}

export function axisAriaLabel(spec, scope) {
  const scaleName = spec.scale;
  const scale = scope.scales[scaleName];
  const axisType = spec.orient === 'bottom' || spec.orient === 'top' ? 'x' : 'y';
  const domain = domainText(scale.params.type, scaleName);
  const signal = `"${axisType} axis${titleText(spec.title)}${domain}`;
  return { signal };
}
