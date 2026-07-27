import {domainCaption, isDiscrete} from 'vega-scale';
import {array, peek, toSet} from 'vega-util';
import {DEFAULT_ARIA_LOCALE, formatString, selectPluralKey} from './aria-locale.js';

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
  'title'
]);

/**
 * Retrieve the aria locale from a group context's dataflow.
 * Falls back to the default English locale.
 */
function getAriaLocale(context) {
  try {
    const loc = context?.dataflow?.ariaLocale?.();
    return loc || DEFAULT_ARIA_LOCALE;
  } catch (e) {
    return DEFAULT_ARIA_LOCALE;
  }
}

/**
 * Resolve the localized mark type name.
 */
function markTypeName(type, loc) {
  return loc['marktype.' + type] || type;
}

// aria attribute generators for guide roles
function ariaGuides(loc) {
  return {
    'axis': {
      desc: loc['role.axis'] || 'axis',
      caption: axisCaption
    },
    'legend': {
      desc: loc['role.legend'] || 'legend',
      caption: legendCaption
    },
    'title-text': {
      desc: loc['role.title'] || 'title',
      caption: item => formatString(loc['titleText'], titleCaption(item))
    },
    'title-subtitle': {
      desc: loc['role.subtitle'] || 'subtitle',
      caption: item => formatString(loc['subtitleText'], titleCaption(item))
    }
  };
}

// aria properties generated for mark item encoding channels
export const AriaEncode = {
  ariaRole: ARIA_ROLE,
  ariaRoleDescription: ARIA_ROLEDESCRIPTION,
  description: ARIA_LABEL
};

export function ariaItemAttributes(emit, item) {
  const hide = item.aria === false;
  emit(ARIA_HIDDEN, hide || undefined);

  if (hide || item.description == null) {
    for (const prop in AriaEncode) {
      emit(AriaEncode[prop], undefined);
    }
  } else {
    const type = item.mark.marktype;
    const loc = getAriaLocale(item.mark.group?.context);
    const typeName = markTypeName(type, loc);
    emit(
      ARIA_LABEL,
      item.description
    );
    emit(
      ARIA_ROLE,
      item.ariaRole || (type === 'group' ? GRAPHICS_OBJECT : GRAPHICS_SYMBOL)
    );
    emit(
      ARIA_ROLEDESCRIPTION,
      item.ariaRoleDescription || formatString(loc['role.mark'] || '{0} mark', typeName)
    );
  }
}

export function ariaMarkAttributes(mark) {
  if (mark.aria === false) return { [ARIA_HIDDEN]: true };
  if (AriaIgnore[mark.role]) return null;

  const loc = getAriaLocale(mark.group?.context);
  if (mark.role) {
    const guides = ariaGuides(loc);
    if (guides[mark.role]) return ariaGuide(mark, guides[mark.role]);
  }
  return ariaMark(mark, loc);
}

function ariaMark(mark, loc) {
  const type = mark.marktype;
  const typeName = markTypeName(type, loc);
  const recurse = (
    type === 'group' ||
    type === 'text' ||
    mark.items.some(_ => _.description != null && _.aria !== false)
  );
  return bundle(
    recurse ? GRAPHICS_OBJECT : GRAPHICS_SYMBOL,
    formatString(loc['role.markContainer'] || '{0} mark container', typeName),
    mark.description
  );
}

function ariaGuide(mark, opt) {
  try {
    const item = mark.items[0],
          caption = opt.caption || (() => '');
    return bundle(
      opt.role || GRAPHICS_SYMBOL,
      opt.desc,
      mark.description || item.description || caption(item)
    );
  } catch (err) {
    return null;
  }
}

function titleCaption(item) {
  return array(item.text).join(' ');
}

function axisCaption(item) {
  const datum = item.datum,
        orient = item.orient,
        title = datum.title ? extractTitle(item) : null,
        ctx = item.context,
        scale = ctx.scales[datum.scale].value,
        locale = ctx.dataflow.locale(),
        type = scale.type,
        loc = getAriaLocale(ctx);

  const orientLabel = (orient === 'left' || orient === 'right')
    ? loc['orientationY']
    : loc['orientationX'];

  let label = formatString(loc['axisLabel'], orientLabel);

  if (title) {
    label += formatString(loc['axisTitled'], title);
  }

  label += isDiscrete(type)
    ? loc['axisScaleDiscrete']
    : formatString(loc['axisScaleContinuous'], type);

  const domain = domainCaption(locale, scale, item, loc, formatString, selectPluralKey);
  label += formatString(loc['axisWithDomain'], domain);

  return label;
}

function legendCaption(item) {
  const datum = item.datum,
        title = datum.title ? extractTitle(item) : null,
        scales = datum.scales,
        props = Object.keys(scales),
        ctx = item.context,
        scale = ctx.scales[scales[props[0]]].value,
        locale = ctx.dataflow.locale(),
        loc = getAriaLocale(ctx);

  // Conditional: legend kind present → format with kind, else use default
  let label = datum.type
    ? formatString(loc['legendType'], datum.type)
    : loc['legendTypeDefault'];

  // Capitalize
  label = label[0].toUpperCase() + label.slice(1);

  if (title) {
    label += formatString(loc['legendTitled'], title);
  }

  const channelDesc = channelCaption(props, loc);
  label += formatString(loc['legendForChannel'], channelDesc);

  const domain = domainCaption(locale, scale, item, loc, formatString, selectPluralKey);
  label += formatString(loc['legendWithDomain'], domain);

  return label;
}

function extractTitle(item) {
  try {
    return array(peek(item.items).items[0].text).join(' ');
  } catch (err) {
    return null;
  }
}

function channelCaption(props, loc) {
  // Each channel has its own localized name, falling back to raw prop name
  const named = props.map(p => loc['channel.' + p] || p);

  if (named.length < 2) return named[0];

  return named.slice(0, -1).join(loc['listJoiner'])
    + loc['listFinalJoiner']
    + named[named.length - 1];
}
