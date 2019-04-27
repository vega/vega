import {textMetrics} from 'vega-scenegraph';
import {checkLabelOutOfBound, collide} from './util';

const X_DIR = [-1, -1, 1, 1];
const Y_DIR = [-1, 1, -1, 1];

export default function(bitmaps, size, avoidBaseMark) {
  let bm0 = bitmaps[0],
      bm1 = bitmaps[1],
      bm2 = bitmaps[2],
      width = size[0],
      height = size[1];

  return function(d) {
    const items = d.datum.datum.items[0].items,
          n = items.length,
          textHeight = d.fontSize,
          textWidth = textMetrics.width(d),
          pixelRatio = bm1.getPixelRatio(),
          stack = [];

    let maxSize = avoidBaseMark ? textHeight : 0,
        labelPlaced = false,
        labelPlaced2 = false,
        maxAreaWidth = 0,
        x1, x2, y1, y2, x, y, _x, _y, lo, hi, mid,
        areaWidth, coordinate, nextX, nextY;

    for (let i=0; i<n; ++i) {
      x1 = items[i].x;
      y1 = items[i].y;
      x2 = items[i].x2 === undefined ? x1 : items[i].x2;
      y2 = items[i].y2 === undefined ? y1 : items[i].y2;

      stack.push([
        bm0.scalePixel((x1 + x2) / 2),
        bm0.scalePixel((y1 + y2) / 2)
      ]);

      while (stack.length) {
        coordinate = stack.pop();
        _x = coordinate[0];
        _y = coordinate[1];
        if (!bm0.getScaled(_x, _y) && !bm1.getScaled(_x, _y) && !bm2.getScaled(_x, _y)) {
          bm2.markScaled(_x, _y);
          for (let j = 0; j < 4; j++) {
            nextX = _x + X_DIR[j];
            nextY = _y + Y_DIR[j];
            if (!bm2.searchOutOfBound(nextX, nextY, nextX, nextY)) {
              stack.push([nextX, nextY]);
            }
          }

          x = _x * pixelRatio - bm0.padding;
          y = _y * pixelRatio - bm0.padding;
          lo = maxSize;
          hi = height; // Todo: make this bound smaller;
          if (
            !checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) &&
            !collide(x, y, textHeight, textWidth, lo, bm0, bm1)
          ) {
            while (hi - lo >= 1) {
              mid = (lo + hi) / 2;
              if (collide(x, y, textHeight, textWidth, mid, bm0, bm1)) {
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
      }
      if (!labelPlaced && !avoidBaseMark) {
        areaWidth = Math.abs(x2 - x1 + y2 - y1);
        x = (x1 + x2) / 2.0;
        y = (y1 + y2) / 2.0;
        if (
          areaWidth >= maxAreaWidth &&
          !checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) &&
          !collide(x, y, textHeight, textWidth, textHeight, bm0, null)
        ) {
          maxAreaWidth = areaWidth;
          d.x = x;
          d.y = y;
          labelPlaced2 = true;
        }
      }
    }

    if (labelPlaced || labelPlaced2) {
      x1 = bm0.scalePixel(d.x - textWidth / 2.0);
      y1 = bm0.scalePixel(d.y - textHeight / 2.0);
      x2 = bm0.scalePixel(d.x + textWidth / 2.0);
      y2 = bm0.scalePixel(d.y + textHeight / 2.0);
      bm0.markInRangeScaled(x1, y1, x2, y2);
      d.align = 'center';
      d.baseline = 'middle';
      return true;
    }

    d.align = 'left';
    d.baseline = 'top';
    return false;
  };
}
