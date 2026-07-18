import {textMetrics} from 'vega-scenegraph';

export default function($, bitmaps, avoidBaseMark, markIndex) {
  const width = $.width,
      height = $.height;

  // try to place a label within an input area mark
  return function(d) {
    const items = d.datum.datum.items[markIndex].items, // area points
          n = items.length, // number of points
          textHeight = d.datum.fontSize, // label width
          textWidth = textMetrics.width(d.datum, d.datum.text); // label height

    let maxAreaWidth = 0,
        x1, x2, y1, y2, x, y, areaWidth;

    // for each area sample point
    for (let i=0; i<n; ++i) {
      x1 = items[i].x;
      y1 = items[i].y;
      x2 = items[i].x2 === undefined ? x1 : items[i].x2;
      y2 = items[i].y2 === undefined ? y1 : items[i].y2;
      x = (x1 + x2) / 2;
      y = (y1 + y2) / 2;

      areaWidth = Math.abs(x2 - x1 + y2 - y1);
      if (areaWidth >= maxAreaWidth) {
        maxAreaWidth = areaWidth;
        d.x = x;
        d.y = y;
      }
    }

    x = textWidth / 2;
    y = textHeight / 2;
    x1 = d.x - x;
    x2 = d.x + x;
    y1 = d.y - y;
    y2 = d.y + y;

    d.align = 'center';
    if (x1 < 0 && x2 <= width) {
      d.align = 'left';
    } else if (0 <= x1 && width < x2) {
      d.align = 'right';
    }

    d.baseline = 'middle';
    if (y1 < 0 && y2 <= height) {
      d.baseline = 'top';
    } else if (0 <= y1 && height < y2) {
      d.baseline = 'bottom';
    }

    return true;
  };
}
