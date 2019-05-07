import {canvas} from 'vega-canvas';
import {rederive} from 'vega-dataflow';
import {Marks} from 'vega-scenegraph';

// bit mask for getting first 2 bytes of alpha value
const ALPHA_MASK = 0xff000000;

// alpha value equivalent to opacity 0.0625
const INSIDE_OPACITY_IN_ALPHA = 0x10000000;
const INSIDE_OPACITY = 0.0625;

export function baseBitmaps($, data) {
  const bitmap = $.bitmap();
  // when there is no base mark but data points are to be avoided
  (data || []).forEach(d => bitmap.set($(d.boundary[0]), $(d.boundary[3])));
  return [bitmap, undefined];
}

export function markBitmaps($, avoidMarks, labelInside, isGroupArea) {
  // create canvas
  const width = $.width,
        height = $.height,
        border = labelInside || isGroupArea,
        context = canvas(width, height).getContext('2d');

  // render all marks to be avoided into canvas
  avoidMarks.forEach(items => draw(context, items, border));

  // get canvas buffer, create bitmaps
  const buffer = new Uint32Array(context.getImageData(0, 0, width, height).data.buffer),
        layer1 = $.bitmap(),
        layer2 = border && $.bitmap();

  // populate bitmap layers
  let x, y, u, v, alpha;
  for (y=0; y < height; ++y) {
    for (x=0; x < width; ++x) {
      alpha = buffer[y * width + x] & ALPHA_MASK;
      if (alpha) {
        u = $(x);
        v = $(y);
        if (!isGroupArea) layer1.set(u, v); // update interior bitmap
        if (border && alpha ^ INSIDE_OPACITY_IN_ALPHA) layer2.set(u, v); // update border bitmap
      }
    }
  }

  return [layer1, layer2];
}

function draw(context, items, interior) {
  if (!items.length) return;
  const type = items[0].mark.marktype;

  if (type === 'group') {
    items.forEach(group => {
      group.items.forEach(mark => draw(context, mark.items, interior));
    });
  } else {
    Marks[type].draw(context, {items: interior ? items.map(prepare) : items});
  }
}

/**
 * Prepare item before drawing into canvas (setting stroke and opacity)
 * @param {object} source item to be prepared
 * @returns prepared item
 */
function prepare(source) {
  const item = rederive(source, {});

  if (item.stroke) {
    item.strokeOpacity = 1;
  }

  if (item.fill) {
    item.fillOpacity = INSIDE_OPACITY;
    item.stroke = '#000';
    item.strokeOpacity = 1;
    item.strokeWidth = 2;
  }

  return item;
}
