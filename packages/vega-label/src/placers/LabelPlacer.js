import {textMetrics} from 'vega-scenegraph';
import {isLabelPlaceable} from './util';

const Aligns = ['right', 'center', 'left'];
const Baselines = ['bottom', 'middle', 'top'];

export default function(bitmaps, size, anchors, offsets) {
  const bm0 = bitmaps[0],
        bm1 = bitmaps[1],
        width = size[0],
        height = size[1];

  return function(d) {
    const mb = d.markBound;
    // can not be placed if the mark is not visible in the graph bound
    if (mb[2] < 0 || mb[5] < 0 || mb[0] > width || mb[3] > height) {
      return false;
    }

    const n = offsets.length,
          textHeight = d.fontSize,
          markBound = d.markBound;

    let textWidth = d.textWidth,
        dx, dy, isInside, sizeFactor, insideFactor,
        x, x1, xc, x2, y1, yc, y2,
        _x1, _x2, _y1, _y2;

    // for each anchor and offset
    for (let i=0; i<n; ++i) {
      dx = (anchors[i] & 0x3) - 1;
      dy = ((anchors[i] >>> 0x2) & 0x3) - 1;

      isInside = (dx === 0 && dy === 0) || offsets[i] < 0;
      sizeFactor = dx && dy ? Math.SQRT1_2 : 1;
      insideFactor = offsets[i] < 0 ? -1 : 1;

      yc = markBound[4 + dy] + (insideFactor * textHeight * dy) / 2.0 + offsets[i] * dy * sizeFactor;
      x = markBound[1 + dx] + offsets[i] * dx * sizeFactor;

      y1 = yc - textHeight / 2.0;
      y2 = yc + textHeight / 2.0;

      _y1 = bm0.scalePixel(y1);
      _y2 = bm0.scalePixel(y2);
      _x1 = bm0.scalePixel(x);

      if (!textWidth) {
        // to avoid finding width of text label,
        if (!isLabelPlaceable(_x1, _x1, _y1, _y2, bm0, bm1, x, x, y1, y2, markBound, isInside)) {
          // skip this anchor/offset option if fail to place the label with 1px width
          continue;
        } else {
          // Otherwise, find the label width
          textWidth = textMetrics.width(d);
        }
      }

      xc = x + (insideFactor * textWidth * dx) / 2.0;
      x1 = xc - textWidth / 2.0;
      x2 = xc + textWidth / 2.0;

      _x1 = bm0.scalePixel(x1);
      _x2 = bm0.scalePixel(x2);

      if (isLabelPlaceable(_x1, _x2, _y1, _y2, bm0, bm1, x1, x2, y1, y2, markBound, isInside)) {
        // place label if the position is placeable
        d.x = !dx ? xc : dx * insideFactor < 0 ? x2 : x1;
        d.y = !dy ? yc : dy * insideFactor < 0 ? y2 : y1;

        d.align = Aligns[dx * insideFactor + 1];
        d.baseline = Baselines[dy * insideFactor + 1];

        bm0.markInRangeScaled(_x1, _y1, _x2, _y2);
        return true;
      }
    }
    return false;
  }
}
