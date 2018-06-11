import {canvas} from 'vega-canvas';

var context,
    currFontHeight;

export var textMetrics = {
  height: fontSize,
  measureWidth: measureWidth,
  estimateWidth: estimateWidth,
  width: estimateWidth,
  canvas: useCanvas
};

useCanvas(true);

// make dumb, simple estimate if no canvas is available
function estimateWidth(item) {
  currFontHeight = fontSize(item);
  return estimate(textValue(item));
}

function estimate(text) {
  return ~~(0.8 * text.length * currFontHeight);
}

// measure text width if canvas is available
function measureWidth(item) {
  context.font = font(item);
  return measure(textValue(item));
}

function measure(text) {
  return context.measureText(text).width;
}

export function fontSize(item) {
  return item.fontSize != null ? item.fontSize : 11;
}

function useCanvas(use) {
  context = use && (context = canvas(1,1)) ? context.getContext('2d') : null;
  textMetrics.width = context ? measureWidth : estimateWidth;
}

export function textValue(item) {
  var s = item.text;
  if (s == null) {
    return '';
  } else {
    return item.limit > 0 ? truncate(item) : s + '';
  }
}

export function truncate(item) {
  var limit = +item.limit,
      text = item.text + '',
      width;

  if (context) {
    context.font = font(item);
    width = measure;
  } else {
    currFontHeight = fontSize(item);
    width = estimate;
  }

  if (width(text) < limit) return text;

  var ellipsis = item.ellipsis || '\u2026',
      rtl = item.dir === 'rtl',
      lo = 0,
      hi = text.length, mid;

  limit -= width(ellipsis);

  if (rtl) {
    while (lo < hi) {
      mid = (lo + hi >>> 1);
      if (width(text.slice(mid)) > limit) lo = mid + 1;
      else hi = mid;
    }
    return ellipsis + text.slice(lo);
  } else {
    while (lo < hi) {
      mid = 1 + (lo + hi >>> 1);
      if (width(text.slice(0, mid)) < limit) lo = mid;
      else hi = mid - 1;
    }
    return text.slice(0, lo) + ellipsis;
  }
}

export function fontFamily(item, quote) {
  var font = item.font;
  return (quote && font
    ? String(font).replace(/"/g, '\'')
    : font) || 'sans-serif';
}

export function font(item, quote) {
  return '' +
    (item.fontStyle ? item.fontStyle + ' ' : '') +
    (item.fontVariant ? item.fontVariant + ' ' : '') +
    (item.fontWeight ? item.fontWeight + ' ' : '') +
    fontSize(item) + 'px ' +
    fontFamily(item, quote);
}

export function offset(item) {
  // perform our own font baseline calculation
  // why? not all browsers support SVG 1.1 'alignment-baseline' :(
  var baseline = item.baseline,
      h = fontSize(item);
  return Math.round(
    baseline === 'top'    ?  0.79*h :
    baseline === 'middle' ?  0.30*h :
    baseline === 'bottom' ? -0.21*h : 0
  );
}
