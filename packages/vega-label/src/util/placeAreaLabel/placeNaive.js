import {textMetrics} from 'vega-scenegraph';
import {collision, outOfBounds} from './common';

export default function($, bitmaps, avoidBaseMark, markIndex) {
  let width = $.width,
      height = $.height,
      bm0 = bitmaps[0], // where labels have been placed
      bm1 = bitmaps[1]; // area outlines
  
  // try to place a label within an input area mark
  return function(d) {
    const items = d.datum.datum.items[markIndex].items, // area points
          n = items.length, // number of points
          textHeight = d.datum.fontSize, // label width
          textWidth = textMetrics.width(d.datum); // label height

    let labelPlaced = false,
        maxAreaWidth = 0,
        labelPlaced2 = false,
        maxAreaWidth2 = 0,
        x1, x2, y1, y2, x, y, areaWidth;

    // for each area sample point
    for (let i=0; i<n; ++i) {
      x1 = items[i].x;
      y1 = items[i].y;
      x2 = items[i].x2 === undefined ? x1 : items[i].x2;
      y2 = items[i].y2 === undefined ? y1 : items[i].y2;

      x = (x1 + x2) / 2;
      y = (y1 + y2) / 2;

      // one span is zero, hence we can add
      areaWidth = Math.abs(x2 - x1 + y2 - y1);

      if (!outOfBounds(x, y, textWidth, textHeight, width, height)) {
        // place label at slice center if it fits and improves the max area width
        if (
          areaWidth >= maxAreaWidth &&
          !collision($, x, y, textHeight, textWidth, textHeight, bm0, bm1)
        ) {
          maxAreaWidth = areaWidth;
          d.x = x;
          d.y = y;
          labelPlaced = true;
        }

        // place label at slice center if it fits and improves the max area width
        // and if we're not avoiding overlap with other areas
        // and if not placed through other means
        if (
          !labelPlaced &&
          !avoidBaseMark &&
          areaWidth >= maxAreaWidth2 &&
          !collision($, x, y, textHeight, textWidth, textHeight, bm0, null)
        ) {
          maxAreaWidth2 = areaWidth;
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
