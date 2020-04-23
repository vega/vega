import {domainCaption, isDiscrete} from 'vega-scale';
import {array, peek, toSet} from 'vega-util';

const ARIA_HIDDEN = 'aria-hidden';
const ARIA_LABEL = 'aria-label';
const ARIA_ROLE = 'role';
const ARIA_ROLEDESCRIPTION = 'aria-roledescription';
const GRAPHICS_OBJECT = 'graphics-object';
const GRAPHICS_SYMBOL = 'graphics-symbol';

const bundle = (role, roledesc, label) => ({
  [ARIA_ROLE]: role,
  [ARIA_ROLEDESCRIPTION]: roledesc,
  [ARIA_LABEL]: label || undefined
});

// these roles are covered by related roles
// we can ignore them, no need to generate attributes
const AriaIgnore = toSet([
  'axis-domain',
  'axis-grid',
  'axis-label',
  'axis-tick',
  'axis-title',
  'legend-band',
  'legend-entry',
  'legend-gradient',
  'legend-label',
  'legend-title',
  'legend-symbol',
  'title',
]);

// aria attribute generators for guide roles
const AriaGuides = {
  'axis': mark =>
    guideAria(mark, GRAPHICS_SYMBOL, 'axis', axisCaption),
  'legend': mark =>
    guideAria(mark, GRAPHICS_SYMBOL, 'legend', legendCaption),
  'title-text': mark =>
    guideAria(mark, GRAPHICS_SYMBOL, 'title', titleCaption),
  'title-subtitle': mark =>
    guideAria(mark, GRAPHICS_SYMBOL, 'subtitle', titleCaption)
};

// aria properties generated for mark item encoding channels
export const AriaEncode = {
  ariaRole: ARIA_ROLE,
  ariaRoleDescription: ARIA_ROLEDESCRIPTION,
  description: ARIA_LABEL
};

export function ariaMarkAttributes(mark) {
  const role = mark.role;
  return AriaIgnore[role] ? null
    : AriaGuides[role] ? AriaGuides[role](mark)
    : mark.aria === false ? { [ARIA_HIDDEN]: true }
    : ariaMark(mark);
}

function ariaMark(mark) {
  const type = mark.marktype;
  const recurse = (
    type === 'group' ||
    type === 'text' ||
    mark.items.some(_ => _.description != null)
  );
  return bundle(
    recurse ? GRAPHICS_OBJECT : GRAPHICS_SYMBOL,
    `${type} mark group`,
    mark.description
  );
}

export function ariaItemAttributes(emit, item) {
  const hide = item.aria === false;
  emit(ARIA_HIDDEN, hide || undefined);

  if (hide || item.description == null) {
    for (const prop in AriaEncode) {
      emit(AriaEncode[prop], undefined);
    }
  } else {
    emit(ARIA_LABEL, item.description);
    emit(ARIA_ROLE, item.ariaRole || GRAPHICS_SYMBOL);
    emit(
      ARIA_ROLEDESCRIPTION,
      item.ariaRoleDescription || `${item.mark.marktype} mark`
    );
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

function titleCaption(item) {
  return array(item.text).join(' ');
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
    return array(peek(item.items).items[0].text).join(' ');
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
