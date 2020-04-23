import {domainCaption, isDiscrete} from 'vega-scale';
import {peek, toSet} from 'vega-util';

const ARIA_HIDDEN = 'aria-hidden';
const ARIA_LABEL = 'aria-label';
const ARIA_ROLE = 'role';
const ARIA_ROLEDESCRIPTION = 'aria-roledescription';
const DEFAULT_ROLE = 'graphics-symbol';

const bundle = (role, roledesc, label) => ({
  [ARIA_ROLE]: role,
  [ARIA_ROLEDESCRIPTION]: roledesc,
  [ARIA_LABEL]: label || undefined
});

// these roles should be hidden from aria support
// instead, a parent element can provide aria attributes
const AriaHidden = toSet([
  'axis-domain',
  'axis-grid',
  'axis-label',
  'axis-tick',
  'axis-title',
  'legend-entry',
  'legend-title'
]);

// these roles are contained within hidden roles
// we can ignore them, no need to generate attributes
const AriaIgnore = toSet([
  'legend-band',
  'legend-gradient',
  'legend-label',
  'legend-symbol'
]);

// aria attribute generators for guide roles
const AriaGuides = {
  'axis': mark => guideAria(mark, DEFAULT_ROLE, 'axis', axisCaption),
  'legend': mark => guideAria(mark, DEFAULT_ROLE, 'legend', legendCaption),
  'title': mark => guideAria(mark, 'caption', 'title'),
  'title-text': () => bundle('caption', 'title text'),
  'title-subtitle': () => bundle('caption', 'subtitle text')
};

// aria properties generated for mark item encoding channels
export const AriaEncode = {
  ariaRole: ARIA_ROLE,
  ariaRoleDescription: ARIA_ROLEDESCRIPTION,
  description: ARIA_LABEL
};

export function ariaMarkAttributes(mark) {
  const role = mark.role;
  return AriaHidden[role] ? { [ARIA_HIDDEN]: true }
    : AriaIgnore[role] ? null
    : AriaGuides[role] ? AriaGuides[role](mark)
    : mark.aria === false ? { [ARIA_HIDDEN]: true }
    : bundle(DEFAULT_ROLE, mark.marktype, mark.description);
}

export function ariaItemAttributes(emit, item) {
  const hide = item.aria === false;
  emit(ARIA_HIDDEN, hide || undefined);
  for (const prop in AriaEncode) {
    emit(AriaEncode[prop], hide ? undefined : item[prop]);
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
        type = scale.type,
        xy = (orient === 'left' || orient === 'right') ? 'Y' : 'X';

  return `${xy}-axis`
    + (title ? ` titled "${title}"` : '')
    + ` for a ${isDiscrete(type) ? 'discrete' : type} scale`
    + ` with ${domainCaption(scale, item)}`;
}

function legendCaption(item) {
  const datum = item.datum,
        title = datum.title ? extractTitle(item) : null,
        type = `${datum.type || ''} legend`.trim(),
        scales = datum.scales,
        props = Object.keys(scales),
        scale = item.context.scales[scales[props[0]]].value;

  return capitalize(type)
    + (title ? ` titled "${title}"` : '')
    + ` for ${channelCaption(props)} with ${domainCaption(scale, item)}`;
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

function capitalize(s) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
