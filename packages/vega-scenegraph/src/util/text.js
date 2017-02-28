import Canvas from './canvas/canvas';

var context,
    fontHeight;

export var textMetrics = {
  height: height,
  measureWidth: measureWidth,
  estimateWidth: estimateWidth,
  width: estimateWidth,
  canvas: canvas
};

canvas(true);

// make dumb, simple estimate if no canvas is available
function estimateWidth(item) {
  return fontHeight = height(item), estimate(textValue(item));
}

function estimate(text) {
  return ~~(0.8 * text.length * fontHeight);
}

// measure text width if canvas is available
function measureWidth(item) {
  return context.font = font(item), measure(textValue(item));
}

function measure(text) {
  return context.measureText(text).width;
}

function height(item) {
  return item.fontSize != null ? item.fontSize : 11;
}

function canvas(_) {
  context = _
    ? (context = Canvas(1,1)) ? context.getContext('2d') : null
    : null;
  textMetrics.width = context ? measureWidth : estimateWidth
}

export function textValue(item) {
  var s = item.text;
  return s == null ? '' : item.limit > 0 ? truncate(item) : s + '';
}

export function truncate(item) {
  var limit = +item.limit,
      text = item.text + '',
      width = context
        ? (context.font = font(item), measure)
        : (fontHeight = height(item), estimate);

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


export function font(item, quote) {
  var font = item.font;
  if (quote && font) {
    font = String(font).replace(/\"/g, '\'');
  }
  return '' +
    (item.fontStyle ? item.fontStyle + ' ' : '') +
    (item.fontVariant ? item.fontVariant + ' ' : '') +
    (item.fontWeight ? item.fontWeight + ' ' : '') +
    height(item) + 'px ' +
    (font || 'sans-serif');
}

export function offset(item) {
  // perform our own font baseline calculation
  // why? not all browsers support SVG 1.1 'alignment-baseline' :(
  var baseline = item.baseline,
      h = height(item);
  return Math.round(
    baseline === 'top'    ?  0.93*h :
    baseline === 'middle' ?  0.30*h :
    baseline === 'bottom' ? -0.21*h : 0
  );
}
