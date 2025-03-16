import {textMetrics} from 'vega-scenegraph';
import {collision, outOfBounds} from './common.js';

export default function($, bitmaps, avoidBaseMark, markIndex) {
  const width = $.width,
      height = $.height,
      bm0 = bitmaps[0], // where labels have been placed
      bm1 = bitmaps[1]; // area outlines

  function tryLabel(_x, _y, maxSize, textWidth, textHeight) {
    const x = $.invert(_x),
          y = $.invert(_y);
    let lo = maxSize,
        hi = height,
        mid;
    if (
      !outOfBounds(x, y, textWidth, textHeight, width, height) &&
      !collision($, x, y, textHeight, textWidth, lo, bm0, bm1) &&
      !collision($, x, y, textHeight, textWidth, textHeight, bm0, null)
    ) {
      // if the label fits at the current sample point,
      // perform binary search to find the largest font size that fits
      while (hi - lo >= 1) {
        mid = (lo + hi) / 2;
        if (collision($, x, y, textHeight, textWidth, mid, bm0, bm1)) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      // place label if current lower bound exceeds prior max font size
      if (lo > maxSize) {
        return [x, y, lo, true];
      }
    }
  }

  // try to place a label within an input area mark
  return function(d) {
    const items = d.datum.datum.items[markIndex].items, // area points
          n = items.length, // number of points
          textHeight = d.datum.fontSize, // label width
          textWidth = textMetrics.width(d.datum, d.datum.text); // label height

    let maxSize = avoidBaseMark ? textHeight : 0,
        labelPlaced = false,
        labelPlaced2 = false,
        maxAreaWidth = 0,
        x1, x2, y1, y2, x, y, _x, _y, _x1, _xMid, _x2, _y1, _yMid, _y2, areaWidth, result, swapTmp;

    // for each area sample point
    for (let i=0; i<n; ++i) {
      x1 = items[i].x;
      y1 = items[i].y;
      x2 = items[i].x2 === undefined ? x1 : items[i].x2;
      y2 = items[i].y2 === undefined ? y1 : items[i].y2;

      if (x1 > x2) {
        swapTmp = x1;
        x1 = x2;
        x2 = swapTmp;
      }

      if (y1 > y2) {
        swapTmp = y1;
        y1 = y2;
        y2 = swapTmp;
      }

      _x1 = $(x1);
      _x2 = $(x2);
      _xMid = ~~((_x1 + _x2) / 2);
      _y1 = $(y1);
      _y2 = $(y2);
      _yMid = ~~((_y1 + _y2) / 2);

      // search along the line from mid point between the 2 border to lower border
      for (_x = _xMid; _x >= _x1; --_x) {
        for (_y = _yMid; _y >= _y1; --_y) {
          result = tryLabel(_x, _y, maxSize, textWidth, textHeight);
          if (result) {
            [d.x, d.y, maxSize, labelPlaced] = result;
          }
        }
      }

      // search along the line from mid point between the 2 border to upper border
      for (_x = _xMid; _x <= _x2; ++_x) {
        for (_y = _yMid; _y <= _y2; ++_y) {
          result = tryLabel(_x, _y, maxSize, textWidth, textHeight);
          if (result) {
            [d.x, d.y, maxSize, labelPlaced] = result;
          }
        }
      }

      // place label at slice center if not placed through other means
      // and if we're not avoiding overlap with other areas
      if (!labelPlaced && !avoidBaseMark) {
        // one span is zero, hence we can add
        areaWidth = Math.abs(x2 - x1 + y2 - y1);
        x = (x1 + x2) / 2;
        y = (y1 + y2) / 2;

        // place label if it fits and improves the max area width
        if (
          areaWidth >= maxAreaWidth &&
          !outOfBounds(x, y, textWidth, textHeight, width, height) &&
          !collision($, x, y, textHeight, textWidth, textHeight, bm0, null)
        ) {
          maxAreaWidth = areaWidth;
          d.x = x;
          d.y = y;
          labelPlaced2 = true;
        }
      }
    }

    // record current label placement information, update label bitmap
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
