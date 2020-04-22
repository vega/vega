import {domainCaption} from 'vega-scale';
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
          title = datum.title ? extractTitle(item) : null,
          scale = item.context.scales[datum.scale].value,
          xy = (orient === 'left' || orient === 'right') ? 'Y' : 'X';

    return xy + '-Axis'
      + (title ? ` titled "${title}"` : '')
      + ` with ${domainCaption(scale)}`;
  } catch (err) {
    return null;
  }
}

function legendCaption(mark) {
  try {
    const item = mark.items[0],
          datum = item.datum,
          title = datum.title ? extractTitle(item) : null,
          scales = datum.scales,
          props = Object.keys(scales),
          scale = item.context.scales[scales[props[0]]].value;

    return 'Legend'
      + (title ? ` titled "${title}"` : '')
      + ` for ${channelCaption(props)} with ${domainCaption(scale)}`;
  } catch (err) {
    return null;
  }
}

function extractTitle(item) {
  try {
    return peek(item.items).items[0].text;
  } catch (err) {
    return null;
  }
}

function channelCaption(props) {
  props = props.map(p => p + (p === 'fill' || p === 'stroke' ? ' color' : ''));
  return props.length < 2 ? props[0]
    : props.slice(0, -1).join(', ') + ' and ' + peek(props);
}
