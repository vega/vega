import {peek, toSet} from 'vega-util';

const ARIA_HIDDEN = 'aria-hidden';
const ARIA_LABEL = 'aria-label';
const ARIA_ROLE = 'aria-role';
const ARIA_ROLEDESCRIPTION = 'aria-roledescription';

const bundle = (desc, role, label) => ({
  [ARIA_ROLE]: role || 'graphics-symbol',
  [ARIA_ROLEDESCRIPTION]: desc,
  [ARIA_LABEL]: label || undefined
});

const AriaHidden = toSet([
  'axis-domain',
  'axis-grid',
  'axis-label',
  'axis-tick',
  'axis-title',
  'legend-entry',
  'legend-title'
]);

const AriaIgnore = toSet([
  'legend-band',
  'legend-gradient',
  'legend-label',
  'legend-symbol'
]);

const AriaRoles = {
  'axis': mark => bundle('axis', null, axisCaption(mark)),
  'legend': mark => bundle('legend', null, legendCaption(mark)),
  'title': () => bundle('title', 'caption'),
  'title-text': () => bundle('title text', 'caption'),
  'title-subtitle': () => bundle('subtitle text', 'caption')
};

export const AriaChannels = {
  ariaHidden: ARIA_HIDDEN,
  ariaRole: ARIA_ROLE,
  ariaRoleDescription: ARIA_ROLEDESCRIPTION,
  ariaLabel: ARIA_LABEL
};

export function ariaMarkAttributes(mark) {
  const role = mark.role;
  return AriaHidden[role] ? { [ARIA_HIDDEN]: true }
    : AriaIgnore[role] ? null
    : AriaRoles[role] ? AriaRoles[role](mark)
    : bundle(mark.marktype);
}

export function ariaItemAttributes(emit, item) {
  const attr = {};
  for (const prop in AriaChannels) {
    if (item[prop] != null) {
      emit(AriaChannels[prop], item[prop]);
    }
  }
  return attr;
}

function axisCaption(mark) {
  try {
    const item = mark.items[0],
          datum = item.datum,
          orient = datum.orient,
          scale = item.context.scales[datum.scale].value,
          type = (orient === 'left' || orient === 'right') ? 'Y' : 'X',
          title = datum.title ? extractTitle(item) : null;

    return type + '-Axis'
      + (title ? ` titled "${title}"` : '')
      + domainCaption(scale);
  } catch (err) {
    return null;
  }
}

function legendCaption(mark) {
  try {
    const item = mark.items[0],
          datum = item.datum,
          scales = datum.scales,
          props = Object.keys(scales),
          scale = item.context.scales[scales[props[0]]].value,
          title = datum.title ? extractTitle(item) : null;

    return 'Legend'
      + (title ? ` titled "${title}"` : '')
      + ` for ${channelCaption(props)}`
      + domainCaption(scale);
  } catch (err) {
    return null;
  }
}

function extractTitle(item) {
  return peek(item.items).items[0].text;
}

function channelCaption(props) {
  props = props.map(p => p + (p === 'fill' || p === 'stroke' ? ' color' : ''));
  return props.length < 2 ? props[0]
    : props.slice(0, -1).join(', ') + ' and ' + peek(props);
}

function isDiscrete(type) {
  return type === 'band' || type === 'ordinal'
      || type === 'point' || type === 'bin-ordinal';
}

function domainCaption(scale) {
  const MAX = 10;
  const d = scale.domain();

  if (isDiscrete(scale.type)) {
    const n = d.length,
          v = n > MAX ? d.slice(0, MAX - 2).concat('\u2026', d.slice(-1)) : d;
    return ` with ${n} discrete value${n !== 1 ? 's' : ''}: ${v.join(', ')}`;
  } else {
    return ` with values from ${d[0]} to ${peek(d)}`;
  }
}
