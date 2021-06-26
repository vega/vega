function outOfBounds(x, y, textWidth, textHeight, width, height) {
  let r = textWidth / 2;
  return x - r < 0
      || x + r > width
      || y - (r = textHeight / 2) < 0
      || y + r > height;
}

function _outOfBounds() {
  return false;
}

function collision($, x, y, textHeight, textWidth, h, bm0, bm1) {
  const w = (textWidth * h) / (textHeight * 2),
        x1 = $(x - w),
        x2 = $(x + w),
        y1 = $(y - (h = h/2)),
        y2 = $(y + h);

  return bm0.outOfBounds(x1, y1, x2, y2)
      || bm0.getRange(x1, y1, x2, y2)
      || (bm1 && bm1.getRange(x1, y1, x2, y2));
}

function _collision($, x, y, textHeight, textWidth, h, bm0, bm1) {
  const w = (textWidth * h) / (textHeight * 2);
  let x1 = $(x - w),
      x2 = $(x + w),
      y1 = $(y - (h = h/2)),
      y2 = $(y + h);

  x1 = x1 > 0 ? x1 : 0;
  y1 = y1 > 0 ? y1 : 0;
  x2 = x2 < $.width ? x2 : $.width - 1;
  y2 = y2 < $.height ? y2 : $.height - 1;

  return bm0.getRange(x1, y1, x2, y2) || (bm1 && bm1.getRange(x1, y1, x2, y2));
}

export function getTests(infPadding) {
  return infPadding
    ? [_collision, _outOfBounds]
    : [collision, outOfBounds];
}