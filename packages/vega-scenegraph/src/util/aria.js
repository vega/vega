import {domainCaption} from 'vega-scale';
import {peek, toSet} from 'vega-util';

const ARIA_HIDDEN = 'aria-hidden';
const ARIA_LABEL = 'aria-label';
const ARIA_ROLE = 'role';
const ARIA_ROLEDESCRIPTION = 'aria-roledescription';

const bundle = (role, roledesc, label) => ({
  [ARIA_ROLE]: role || 'graphics-symbol',
  [ARIA_ROLEDESCRIPTION]: roledesc,
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
  'axis': mark => guideAria(mark, null, 'axis', axisCaption),
  'legend': mark => guideAria(mark, null, 'legend', legendCaption),
  'title': mark => guideAria(mark, 'caption', 'title'),
  'title-text': () => bundle('caption', 'title text'),
  'title-subtitle': () => bundle('caption', 'subtitle text')
};

export const AriaChannels = {
  ariaRole: ARIA_ROLE,
  ariaRoleDescription: ARIA_ROLEDESCRIPTION,
  description: ARIA_LABEL
};

export function ariaMarkAttributes(mark) {
  const role = mark.role;
  return AriaHidden[role] ? { [ARIA_HIDDEN]: true }
    : AriaIgnore[role] ? null
    : AriaRoles[role] ? AriaRoles[role](mark)
    : bundle(null, mark.marktype);
}

export function ariaItemAttributes(emit, item) {
  const hide = item.aria === false;
  emit(ARIA_HIDDEN, hide || undefined);
  for (const prop in AriaChannels) {
    emit(AriaChannels[prop], hide ? undefined : item[prop]);
  }
}

function guideAria(mark, role, roledesc, caption) {
  caption = caption || (() => '');
  try {
    const item = mark.items[0];
    return item.aria === false ? { [ARIA_HIDDEN]: true }
      : bundle(role, roledesc, item.description || caption(item));
  } catch (err) {
    return null;
  }
}

function axisCaption(item) {
  const datum = item.datum,
        orient = datum.orient,
        title = datum.title ? extractTitle(item) : null,
        scale = item.context.scales[datum.scale].value,
        xy = (orient === 'left' || orient === 'right') ? 'Y' : 'X';

  return xy + '-Axis'
    + (title ? ` titled "${title}"` : '')
    + ` with ${domainCaption(scale)}`;
}

function legendCaption(item) {
  const datum = item.datum,
        title = datum.title ? extractTitle(item) : null,
        scales = datum.scales,
        props = Object.keys(scales),
        scale = item.context.scales[scales[props[0]]].value;

  return 'Legend'
    + (title ? ` titled "${title}"` : '')
    + ` for ${channelCaption(props)} with ${domainCaption(scale)}`;
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
