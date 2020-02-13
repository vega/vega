import {context} from './canvas/context';
import {isArray} from 'vega-util';

var currFontHeight;

export var textMetrics = {
  height: fontSize,
  measureWidth: measureWidth,
  estimateWidth: estimateWidth,
  width: estimateWidth,
  canvas: useCanvas
};

useCanvas(true);

// make dumb, simple estimate if no canvas is available
function estimateWidth(item, text) {
  currFontHeight = fontSize(item);
  return estimate(textValue(item, text));
}

function estimate(text) {
  return ~~(0.8 * text.length * currFontHeight);
}

// measure text width if canvas is available
function measureWidth(item, text) {
  return fontSize(item) <= 0 ? 0
    : (context.font = font(item), measure(textValue(item, text)));
}

function measure(text) {
  return context.measureText(text).width;
}

export function fontSize(item) {
  return item.fontSize != null ? item.fontSize : 11;
}

function useCanvas(use) {
  textMetrics.width = (use && context) ? measureWidth : estimateWidth;
}

export function lineHeight(item) {
  return item.lineHeight != null ? item.lineHeight : (fontSize(item) + 2);
}

function lineArray(_) {
  return isArray(_) ? _.length > 1 ? _ : _[0] : _;
}

export function textLines(item) {
  return lineArray(
    item.lineBreak && item.text && !isArray(item.text)
      ? item.text.split(item.lineBreak)
      : item.text
  );
}

export function multiLineOffset(item) {
  const tl = textLines(item);
  return (isArray(tl) ? (tl.length - 1) : 0) * lineHeight(item);
}

export function textValue(item, line) {
  return line == null ? ''
    : item.limit > 0 ? truncate(item, line)
    : line + '';
}

function truncate(item, line) {
  var limit = +item.limit,
      text = line + '',
      width;

  if (textMetrics.width === measureWidth) {
    // we are using canvas
    context.font = font(item);
    width = measure;
  } else {
    // we are relying on estimates
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
