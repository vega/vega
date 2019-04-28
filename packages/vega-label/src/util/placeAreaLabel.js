import {checkLabelOutOfBound, collide} from './util';
import {textMetrics} from 'vega-scenegraph';

const X_DIR = [-1, -1, 1, 1];
const Y_DIR = [-1, 1, -1, 1];

export default function($, bitmaps, avoidBaseMark) {
  let width = $.width,
      height = $.height,
      bm0 = bitmaps[0],
      bm1 = bitmaps[1],
      bm2 = $.bitmap();

  return function(d) {
    const items = d.datum.datum.items[0].items,
          n = items.length,
          textHeight = d.datum.fontSize,
          textWidth = textMetrics.width(d.datum),
          stack = [];

    let maxSize = avoidBaseMark ? textHeight : 0,
        labelPlaced = false,
        labelPlaced2 = false,
        maxAreaWidth = 0,
        x1, x2, y1, y2, x, y, _x, _y, lo, hi, mid, areaWidth;

    for (let i=0; i<n; ++i) {
      x1 = items[i].x;
      y1 = items[i].y;
      x2 = items[i].x2 === undefined ? x1 : items[i].x2;
      y2 = items[i].y2 === undefined ? y1 : items[i].y2;
      stack.push([$((x1 + x2) / 2), $((y1 + y2) / 2)]);

      while (stack.length) {
        [_x, _y] = stack.pop();
        if (bm0.get(_x, _y) || bm1.get(_x, _y) || bm2.get(_x, _y)) continue;

        bm2.set(_x, _y);
        for (let j=0; j<4; ++j) {
          x = _x + X_DIR[j];
          y = _y + Y_DIR[j];
          if (!bm2.outOfBounds(x, y, x, y)) stack.push([x, y]);
        }

        x = $.invert(_x);
        y = $.invert(_y);
        lo = maxSize;
        hi = height; // TODO: make this bound smaller

        if (
          !checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) &&
          !collide($, x, y, textHeight, textWidth, lo, bm0, bm1)
        ) {
          while (hi - lo >= 1) {
            mid = (lo + hi) / 2;
            if (collide($, x, y, textHeight, textWidth, mid, bm0, bm1)) {
              hi = mid;
            } else {
              lo = mid;
            }
          }
          if (lo > maxSize) {
            d.x = x;
            d.y = y;
            maxSize = lo;
            labelPlaced = true;
          }
        }
      }

      if (!labelPlaced && !avoidBaseMark) {
        areaWidth = Math.abs(x2 - x1 + y2 - y1);
        x = (x1 + x2) / 2;
        y = (y1 + y2) / 2;
        if (
          areaWidth >= maxAreaWidth &&
          !checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) &&
          !collide($, x, y, textHeight, textWidth, textHeight, bm0, null)
        ) {
          maxAreaWidth = areaWidth;
          d.x = x;
          d.y = y;
          labelPlaced2 = true;
        }
      }
    }

    if (labelPlaced || labelPlaced2) {
      x = textWidth / 2;
      y = textHeight / 2;
      bm0.setRange($(d.x - x), $(d.y - y), $(d.x + x), $(d.y + y));
      d.align = 'center';
      d.baseline = 'middle';
      return true;
    } else {
      return false;
    }
  };
}
