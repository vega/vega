import {canvas} from 'vega-canvas';
import {rederive} from 'vega-dataflow';
import {Marks} from 'vega-scenegraph';

// bit mask for getting first 2 bytes of alpha value
const ALPHA_MASK = 0xff000000;

export function baseBitmaps($, data) {
  const bitmap = $.bitmap();
  // when there is no base mark but data points are to be avoided
  (data || []).forEach(d => bitmap.set($(d.boundary[0]), $(d.boundary[3])));
  return [bitmap, undefined];
}

export function markBitmaps($, baseMark, avoidMarks, labelInside, isGroupArea) {
  // create canvas
  const width = $.width,
        height = $.height,
        border = labelInside || isGroupArea,
        context = canvas(width, height).getContext('2d'),
        baseMarkContext = canvas(width, height).getContext('2d'),
        strokeContext = border && canvas(width, height).getContext('2d');

  // render all marks to be avoided into canvas
  avoidMarks.forEach(items => draw(context, items, false));
  draw(baseMarkContext, baseMark, false);
  if (border) {
    draw(strokeContext, baseMark, true);
  }

  // get canvas buffer, create bitmaps
  const buffer = getBuffer(context, width, height),
        baseMarkBuffer = getBuffer(baseMarkContext, width, height),
        strokeBuffer = border && getBuffer(strokeContext, width, height),
        layer1 = $.bitmap(),
        layer2 = border && $.bitmap();

  // populate bitmap layers
  let x, y, u, v, index, alpha, strokeAlpha, baseMarkAlpha;
  for (y=0; y < height; ++y) {
    for (x=0; x < width; ++x) {
      index = y * width + x;

      alpha = buffer[index] & ALPHA_MASK;
      baseMarkAlpha = baseMarkBuffer[index] & ALPHA_MASK;
      strokeAlpha = border && (strokeBuffer[index] & ALPHA_MASK);

      if (alpha || strokeAlpha || baseMarkAlpha) {
        u = $(x);
        v = $(y);
        if (!isGroupArea && (alpha || baseMarkAlpha)) layer1.set(u, v); // update interior bitmap
        if (border && (alpha || strokeAlpha)) layer2.set(u, v); // update border bitmap
      }
    }
  }

  return [layer1, layer2];
}

function getBuffer(context, width, height) {
  return new Uint32Array(context.getImageData(0, 0, width, height).data.buffer);
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

  if (
    (item.stroke && item.strokeOpacity !== 0) ||
    (item.fill && item.fillOpacity !== 0)
  ) {
    return {
      ...item,
      strokeOpacity: 1,
      stroke: '#000',
      fillOpacity: 0
    };
  }

  return item;
}
