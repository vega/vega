import {context} from './canvas/context.js';
import {isArray, lruCache} from 'vega-util';

// memoize text width measurement
const widthCache = lruCache();

export var textMetrics = {
  height: fontSize,
  measureWidth: measureWidth,
  estimateWidth: estimateWidth,
  width: estimateWidth,
  canvas: useCanvas
};

useCanvas(true);

function useCanvas(use) {
  textMetrics.width = (use && context) ? measureWidth : estimateWidth;
}

// Advance widths of printable ASCII in thousandths of an em, from Helvetica,
// whose metrics Arial and Liberation Sans share. Most systems resolve the
// default sans-serif font to one of them.
const ASCII_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584
];

const ZWJ = 0x200d;

function charWidth(c) {
  return c >= 32 && c < 127 ? ASCII_WIDTHS[c - 32]
    // combining marks, zero-width characters, variation selectors,
    // emoji skin tone modifiers and tags extend the previous character
    : (c >= 0x0300 && c <= 0x036f) || (c >= 0x200b && c <= 0x200f)
      || (c >= 0xfe00 && c <= 0xfe0f) || (c >= 0x1f3fb && c <= 0x1f3ff)
      || (c >= 0xe0000 && c <= 0xe007f) || c === 0x20e3 ? 0
    : (c >= 0x1f300 && c <= 0x1faff) ? 1250
    : (c >= 0x1100 && c <= 0x115f) || (c >= 0x2e80 && c <= 0xa4cf)
      || (c >= 0xac00 && c <= 0xd7a3) || (c >= 0xf900 && c <= 0xfaff)
      || (c >= 0xfe30 && c <= 0xfe4f) || (c >= 0xff00 && c <= 0xff60)
      || (c >= 0xffe0 && c <= 0xffe6) || (c >= 0x20000 && c <= 0x3fffd) ? 1000
    : 600;
}

function isBold(item) {
  const w = item.fontWeight;
  return w === 'bold' || w === 'bolder' || +w >= 600;
}

// estimate text width if no canvas is available
function estimateWidth(item, text) {
  return _estimateWidth(textValue(item, text), item);
}

function _estimateWidth(text, item) {
  let width = 0, joined = false;
  for (const char of text) {
    const c = char.codePointAt(0);
    // a character joined by ZWJ is part of the previous emoji
    if (!joined) width += charWidth(c);
    joined = c === ZWJ;
  }
  return width * fontSize(item) * (isBold(item) ? 1.1 : 1) / 1000;
}

// measure text width if canvas is available
function measureWidth(item, text) {
  return fontSize(item) <= 0 || !(text = textValue(item, text)) ? 0
    : _measureWidth(text, font(item));
}

function _measureWidth(text, currentFont) {
  const key = `(${currentFont}) ${text}`;
  let width = widthCache.get(key);
  if (width === undefined) {
    context.font = currentFont;
    width = context.measureText(text).width;
    widthCache.set(key, width);
  }
  return width;
}

export function fontSize(item) {
  return item.fontSize != null ? (+item.fontSize || 0) : 11;
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
  const text = line == null ? '' : (line + '').trim();
  return item.limit > 0 && text.length ? truncate(item, text) : text;
}

function widthGetter(item) {
  if (textMetrics.width === measureWidth) {
    // we are using canvas
    const currentFont = font(item);
    return text => _measureWidth(text, currentFont);
  } else if (textMetrics.width === estimateWidth) {
    // we are relying on estimates
    return text => _estimateWidth(text, item);
  } else {
    // User defined textMetrics.width function in use (e.g. vl-convert)
    return text => textMetrics.width(item, text);
  }
}

function truncate(item, text) {
  var limit = +item.limit,
      width = widthGetter(item);

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
  // this also ensures consistent layout across renderers
  var baseline = item.baseline,
      h = fontSize(item);

  return Math.round(
    baseline === 'top'         ?  0.79 * h :
    baseline === 'middle'      ?  0.30 * h :
    baseline === 'bottom'      ? -0.21 * h :
    baseline === 'line-top'    ?  0.29 * h + 0.5 * lineHeight(item) :
    baseline === 'line-bottom' ?  0.29 * h - 0.5 * lineHeight(item) : 0
  );
}
