import Canvas from './canvas/canvas';

var context;

function estimateWidth(item) {
  // make dumb, simple estimate if no canvas is available
  return ~~(0.8 * textValue(item).length * height(item));
}

function measureWidth(item) {
  // measure text width if canvas is available
  context.font = font(item);
  return context.measureText(textValue(item.text)).width;
}

export var width = (context = Canvas(1, 1))
  ? (context = context.getContext('2d'), measureWidth)
  : estimateWidth;

export function height(item) {
  return item.fontSize != null ? item.fontSize : 11;
}

export function textValue(s) {
  return s != null ? String(s) : '';
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
