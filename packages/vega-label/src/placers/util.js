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
  return bitMap.getInRangeScaled(x1, y2, x2, y2)
      || bitMap.getInRangeScaled(x1, y1, x2, y2 - 1);
}

export function isLabelPlaceable(_x1, _x2, _y1, _y2, bm0, bm1, x1, x2, y1, y2, markBound, isInside) {
  return !(
    bm0.searchOutOfBound(_x1, _y1, _x2, _y2) ||
    (isInside
      ? checkCollision(_x1, _y1, _x2, _y2, bm1) || !isInMarkBound(x1, y1, x2, y2, markBound)
      : checkCollision(_x1, _y1, _x2, _y2, bm0))
  );
}

export function isInMarkBound(x1, y1, x2, y2, markBound) {
  return markBound[0] <= x1 && x2 <= markBound[2] && markBound[3] <= y1 && y2 <= markBound[5];
}

export function checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) {
  return x - textWidth / 2.0 < 0
      || y - textHeight / 2.0 < 0
      || x + textWidth / 2.0 > width
      || y + textHeight / 2.0 > height;
}

export function collide(x, y, textHeight, textWidth, h, bm0, bm1) {
  const w = (textWidth * h) / (textHeight * 2),
        x1 = bm0.scalePixel(x - w),
        x2 = bm0.scalePixel(x + w),
        y1 = bm0.scalePixel(y - (h = h/2)),
        y2 = bm0.scalePixel(y + h);

  return bm0.searchOutOfBound(x1, y1, x2, y2)
      || checkCollision(x1, y1, x2, y2, bm0)
      || (bm1 && checkCollision(x1, y1, x2, y2, bm1));
}
