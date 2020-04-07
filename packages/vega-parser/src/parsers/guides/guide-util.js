import {Left, Right, Center, Start, End, Vertical, LegendScales, Bottom, Top} from './constants';
import {value, isSignal} from '../../util';
import {isArray, isObject, stringValue} from 'vega-util';
import {isDiscrete} from 'vega-scale';

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

// FIXME: the encoder argument probably shouldn't be here
export function addAriaAnnotations(spec, _, scope, encoder, props) {
  const hidden = _(props.hidden);
  const label = _(props.label);

  const aria = hidden === true
    ? {
        ariaHidden: encoder(hidden)
      }
    : {
        ariaLabel: encoder(label !== undefined ? label : props.defaultLabel(_, scope)),
        ariaRole: encoder(_(props.role)),
        ariaRoleDescription: encoder(_(props.roleDescription))
      };

  return Object.assign(spec, aria);
}

function wrapFormat(text, format, formatType) {
  if (format == null) {
    return text
  }
  const func = formatType === 'time' ? 'timeFormat' : formatType === 'utc' ? 'utcFormat' : 'format';
  return `${func}(${text}, "${format}")`;
}

function domainText(scaleType, scaleName, format, formatType) {
  return isDiscrete(scaleType)
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

function titleText(title) {
  if (isArray(title)) {
    // only use the first row of multiline titles
    title = title[0];
  }

  if (title) {
    return isObject(title) && isSignal(title) ? ` showing " + ${title.signal} + "` : ` showing ${title}`;
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
      domains.push(`${domain} + " as ${legendType}`);
    }
  }
  const signal = `"legend${titleText(_('title'))}${domains.join(',')}"`;
  return { signal };
}

export function axisAriaLabel(_, scope) {
  const scaleName = _('scale');
  const scaleType = scope.scales[scaleName].params.type;
  const orient = _('orient');
  const axisType = orient === Bottom || orient === Top ? 'x' : 'y';
  const domain = domainText(scaleType, scaleName, _('format'), _('formatType') || scaleType);
  const signal = `"${axisType} axis${titleText(_('title'))}${domain}`;
  return { signal };
}
