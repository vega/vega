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

/**
 * Check if the area in `x1`, `y1`, `x2`, `y2` has occupied pixel
 * @param {number} x1 starting range of x-axis to be checked
 * @param {number} x2 ending range of x-axis to be checked
 * @param {number} y1 starting range of y-axis to be checked
 * @param {number} y2 ending range of y-axis to be checked
 * @param {object} bitMap bitmap to be checking
 * @returns true if there is a pixel occupied in the area. Otherwise, false.
 */
export function checkCollision(x1, y1, x2, y2, bitMap) {
  return bitMap.getInRangeScaled(x1, y2, x2, y2) || bitMap.getInRangeScaled(x1, y1, x2, y2 - 1);
}
