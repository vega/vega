/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/

/**
 * Calculate width of `text` with font size `fontSize` and font `font`
 * @param {object} context 2d-context of canvas
 * @param {string} text the string, which width to be calculated
 * @param {number} fontSize font size of `text`
 * @param {string} font font of `text`
 */
export function labelWidth(context, text, fontSize, font) {
  // TODO: support other font properties
  context.font = fontSize + 'px ' + font;
  return context.measureText(text).width;
}

export function checkCollision(x1, y1, x2, y2, bitMap) {
  return bitMap.getInRangeScaled(x1, y2, x2, y2) || bitMap.getInRangeScaled(x1, y1, x2, y2 - 1);
}
