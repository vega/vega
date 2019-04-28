/**
 * Check if the area in `x1`, `y1`, `x2`, `y2` has occupied pixel
 * @param {number} x1 starting range of x-axis to be checked
 * @param {number} x2 ending range of x-axis to be checked
 * @param {number} y1 starting range of y-axis to be checked
 * @param {number} y2 ending range of y-axis to be checked
 * @param {object} bitMap bitmap to be checking
 * @returns true if there is a pixel occupied in the area. Otherwise, false.
 */
export function checkCollision(x1, y1, x2, y2, bm) {
  return bm.getRange(x1, y2, x2, y2) || bm.getRange(x1, y1, x2, y2 - 1);
}

export function isLabelPlaceable(_x1, _x2, _y1, _y2, bm0, bm1, x1, x2, y1, y2, boundary, isInside) {
  return !(
    bm0.outOfBounds(_x1, _y1, _x2, _y2) ||
    (isInside
      ? checkCollision(_x1, _y1, _x2, _y2, bm1) || !isInMarkBound(x1, y1, x2, y2, boundary)
      : checkCollision(_x1, _y1, _x2, _y2, bm0))
  );
}

export function isInMarkBound(x1, y1, x2, y2, boundary) {
  return boundary[0] <= x1 && x2 <= boundary[2]
      && boundary[3] <= y1 && y2 <= boundary[5];
}

export function checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) {
  let r = textWidth / 2;
  return x - r < 0
      || x + r > width
      || y - (r = textHeight / 2) < 0
      || y + r > height;
}

export function collide($, x, y, textHeight, textWidth, h, bm0, bm1) {
  const w = (textWidth * h) / (textHeight * 2),
        x1 = $(x - w),
        x2 = $(x + w),
        y1 = $(y - (h = h/2)),
        y2 = $(y + h);

  return bm0.outOfBounds(x1, y1, x2, y2)
      || checkCollision(x1, y1, x2, y2, bm0)
      || (bm1 && checkCollision(x1, y1, x2, y2, bm1));
}
