import { Marks, textMetrics } from 'vega-scenegraph';
import { canvas } from 'vega-canvas';
import { rederive, Transform } from 'vega-dataflow';
import { inherits, error, array, isFunction } from 'vega-util';

// bit mask for getting first 2 bytes of alpha value
const ALPHA_MASK = 0xff000000;
function baseBitmaps($, data) {
  const bitmap = $.bitmap();
  // when there is no base mark but data points are to be avoided
  (data || []).forEach(d => bitmap.set($(d.boundary[0]), $(d.boundary[3])));
  return [bitmap, undefined];
}
function markBitmaps($, baseMark, avoidMarks, labelInside, isGroupArea) {
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
  for (y = 0; y < height; ++y) {
    for (x = 0; x < width; ++x) {
      index = y * width + x;
      alpha = buffer[index] & ALPHA_MASK;
      baseMarkAlpha = baseMarkBuffer[index] & ALPHA_MASK;
      strokeAlpha = border && strokeBuffer[index] & ALPHA_MASK;
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
    Marks[type].draw(context, {
      items: interior ? items.map(prepare) : items
    });
  }
}

/**
 * Prepare item before drawing into canvas (setting stroke and opacity)
 * @param {object} source item to be prepared
 * @returns prepared item
 */
function prepare(source) {
  const item = rederive(source, {});
  if (item.stroke && item.strokeOpacity !== 0 || item.fill && item.fillOpacity !== 0) {
    return {
      ...item,
      strokeOpacity: 1,
      stroke: '#000',
      fillOpacity: 0
    };
  }
  return item;
}

const DIV = 5,
  // bit shift from x, y index to bit vector array index
  MOD = 31,
  // bit mask for index lookup within a bit vector
  SIZE = 32,
  // individual bit vector size
  RIGHT0 = new Uint32Array(SIZE + 1),
  // left-anchored bit vectors, full -> 0
  RIGHT1 = new Uint32Array(SIZE + 1); // right-anchored bit vectors, 0 -> full

RIGHT1[0] = 0;
RIGHT0[0] = ~RIGHT1[0];
for (let i = 1; i <= SIZE; ++i) {
  RIGHT1[i] = RIGHT1[i - 1] << 1 | 1;
  RIGHT0[i] = ~RIGHT1[i];
}
function Bitmap (w, h) {
  const array = new Uint32Array(~~((w * h + SIZE) / SIZE));
  function _set(index, mask) {
    array[index] |= mask;
  }
  function _clear(index, mask) {
    array[index] &= mask;
  }
  return {
    array: array,
    get: (x, y) => {
      const index = y * w + x;
      return array[index >>> DIV] & 1 << (index & MOD);
    },
    set: (x, y) => {
      const index = y * w + x;
      _set(index >>> DIV, 1 << (index & MOD));
    },
    clear: (x, y) => {
      const index = y * w + x;
      _clear(index >>> DIV, ~(1 << (index & MOD)));
    },
    getRange: (x, y, x2, y2) => {
      let r = y2,
        start,
        end,
        indexStart,
        indexEnd;
      for (; r >= y; --r) {
        start = r * w + x;
        end = r * w + x2;
        indexStart = start >>> DIV;
        indexEnd = end >>> DIV;
        if (indexStart === indexEnd) {
          if (array[indexStart] & RIGHT0[start & MOD] & RIGHT1[(end & MOD) + 1]) {
            return true;
          }
        } else {
          if (array[indexStart] & RIGHT0[start & MOD]) return true;
          if (array[indexEnd] & RIGHT1[(end & MOD) + 1]) return true;
          for (let i = indexStart + 1; i < indexEnd; ++i) {
            if (array[i]) return true;
          }
        }
      }
      return false;
    },
    setRange: (x, y, x2, y2) => {
      let start, end, indexStart, indexEnd, i;
      for (; y <= y2; ++y) {
        start = y * w + x;
        end = y * w + x2;
        indexStart = start >>> DIV;
        indexEnd = end >>> DIV;
        if (indexStart === indexEnd) {
          _set(indexStart, RIGHT0[start & MOD] & RIGHT1[(end & MOD) + 1]);
        } else {
          _set(indexStart, RIGHT0[start & MOD]);
          _set(indexEnd, RIGHT1[(end & MOD) + 1]);
          for (i = indexStart + 1; i < indexEnd; ++i) _set(i, 0xffffffff);
        }
      }
    },
    clearRange: (x, y, x2, y2) => {
      let start, end, indexStart, indexEnd, i;
      for (; y <= y2; ++y) {
        start = y * w + x;
        end = y * w + x2;
        indexStart = start >>> DIV;
        indexEnd = end >>> DIV;
        if (indexStart === indexEnd) {
          _clear(indexStart, RIGHT1[start & MOD] | RIGHT0[(end & MOD) + 1]);
        } else {
          _clear(indexStart, RIGHT1[start & MOD]);
          _clear(indexEnd, RIGHT0[(end & MOD) + 1]);
          for (i = indexStart + 1; i < indexEnd; ++i) _clear(i, 0);
        }
      }
    },
    outOfBounds: (x, y, x2, y2) => x < 0 || y < 0 || y2 >= h || x2 >= w
  };
}

function scaler (width, height, padding) {
  const ratio = Math.max(1, Math.sqrt(width * height / 1e6)),
    w = ~~((width + 2 * padding + ratio) / ratio),
    h = ~~((height + 2 * padding + ratio) / ratio),
    scale = _ => ~~((_ + padding) / ratio);
  scale.invert = _ => _ * ratio - padding;
  scale.bitmap = () => Bitmap(w, h);
  scale.ratio = ratio;
  scale.padding = padding;
  scale.width = width;
  scale.height = height;
  return scale;
}

function placeAreaLabelNaive ($, bitmaps, avoidBaseMark, markIndex) {
  const width = $.width,
    height = $.height;

  // try to place a label within an input area mark
  return function (d) {
    const items = d.datum.datum.items[markIndex].items,
      // area points
      n = items.length,
      // number of points
      textHeight = d.datum.fontSize,
      // label width
      textWidth = textMetrics.width(d.datum, d.datum.text); // label height

    let maxAreaWidth = 0,
      x1,
      x2,
      y1,
      y2,
      x,
      y,
      areaWidth;

    // for each area sample point
    for (let i = 0; i < n; ++i) {
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

function outOfBounds(x, y, textWidth, textHeight, width, height) {
  let r = textWidth / 2;
  return x - r < 0 || x + r > width || y - (r = textHeight / 2) < 0 || y + r > height;
}
function collision($, x, y, textHeight, textWidth, h, bm0, bm1) {
  const w = textWidth * h / (textHeight * 2),
    x1 = $(x - w),
    x2 = $(x + w),
    y1 = $(y - (h = h / 2)),
    y2 = $(y + h);
  return bm0.outOfBounds(x1, y1, x2, y2) || bm0.getRange(x1, y1, x2, y2) || bm1 && bm1.getRange(x1, y1, x2, y2);
}

function placeAreaLabelReducedSearch ($, bitmaps, avoidBaseMark, markIndex) {
  const width = $.width,
    height = $.height,
    bm0 = bitmaps[0],
    // where labels have been placed
    bm1 = bitmaps[1]; // area outlines

  function tryLabel(_x, _y, maxSize, textWidth, textHeight) {
    const x = $.invert(_x),
      y = $.invert(_y);
    let lo = maxSize,
      hi = height,
      mid;
    if (!outOfBounds(x, y, textWidth, textHeight, width, height) && !collision($, x, y, textHeight, textWidth, lo, bm0, bm1) && !collision($, x, y, textHeight, textWidth, textHeight, bm0, null)) {
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
  return function (d) {
    const items = d.datum.datum.items[markIndex].items,
      // area points
      n = items.length,
      // number of points
      textHeight = d.datum.fontSize,
      // label width
      textWidth = textMetrics.width(d.datum, d.datum.text); // label height

    let maxSize = avoidBaseMark ? textHeight : 0,
      labelPlaced = false,
      labelPlaced2 = false,
      maxAreaWidth = 0,
      x1,
      x2,
      y1,
      y2,
      x,
      y,
      _x,
      _y,
      _x1,
      _xMid,
      _x2,
      _y1,
      _yMid,
      _y2,
      areaWidth,
      result,
      swapTmp;

    // for each area sample point
    for (let i = 0; i < n; ++i) {
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
        if (areaWidth >= maxAreaWidth && !outOfBounds(x, y, textWidth, textHeight, width, height) && !collision($, x, y, textHeight, textWidth, textHeight, bm0, null)) {
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

// pixel direction offsets for flood fill search
const X_DIR = [-1, -1, 1, 1];
const Y_DIR = [-1, 1, -1, 1];
function placeAreaLabelFloodFill ($, bitmaps, avoidBaseMark, markIndex) {
  const width = $.width,
    height = $.height,
    bm0 = bitmaps[0],
    // where labels have been placed
    bm1 = bitmaps[1],
    // area outlines
    bm2 = $.bitmap(); // flood-fill visitations

  // try to place a label within an input area mark
  return function (d) {
    const items = d.datum.datum.items[markIndex].items,
      // area points
      n = items.length,
      // number of points
      textHeight = d.datum.fontSize,
      // label width
      textWidth = textMetrics.width(d.datum, d.datum.text),
      // label height
      stack = []; // flood fill stack

    let maxSize = avoidBaseMark ? textHeight : 0,
      labelPlaced = false,
      labelPlaced2 = false,
      maxAreaWidth = 0,
      x1,
      x2,
      y1,
      y2,
      x,
      y,
      _x,
      _y,
      lo,
      hi,
      mid,
      areaWidth;

    // for each area sample point
    for (let i = 0; i < n; ++i) {
      x1 = items[i].x;
      y1 = items[i].y;
      x2 = items[i].x2 === undefined ? x1 : items[i].x2;
      y2 = items[i].y2 === undefined ? y1 : items[i].y2;

      // add scaled center point to stack
      stack.push([$((x1 + x2) / 2), $((y1 + y2) / 2)]);

      // perform flood fill, visit points
      while (stack.length) {
        [_x, _y] = stack.pop();

        // exit if point already marked
        if (bm0.get(_x, _y) || bm1.get(_x, _y) || bm2.get(_x, _y)) continue;

        // mark point in flood fill bitmap
        // add search points for all (in bound) directions
        bm2.set(_x, _y);
        for (let j = 0; j < 4; ++j) {
          x = _x + X_DIR[j];
          y = _y + Y_DIR[j];
          if (!bm2.outOfBounds(x, y, x, y)) stack.push([x, y]);
        }

        // unscale point back to x, y space
        x = $.invert(_x);
        y = $.invert(_y);
        lo = maxSize;
        hi = height; // TODO: make this bound smaller

        if (!outOfBounds(x, y, textWidth, textHeight, width, height) && !collision($, x, y, textHeight, textWidth, lo, bm0, bm1) && !collision($, x, y, textHeight, textWidth, textHeight, bm0, null)) {
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
            d.x = x;
            d.y = y;
            maxSize = lo;
            labelPlaced = true;
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
        if (areaWidth >= maxAreaWidth && !outOfBounds(x, y, textWidth, textHeight, width, height) && !collision($, x, y, textHeight, textWidth, textHeight, bm0, null)) {
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

const Aligns = ['right', 'center', 'left'],
  Baselines = ['bottom', 'middle', 'top'];
function placeMarkLabel ($, bitmaps, anchors, offsets) {
  const width = $.width,
    height = $.height,
    bm0 = bitmaps[0],
    bm1 = bitmaps[1],
    n = offsets.length;
  return function (d) {
    const boundary = d.boundary,
      textHeight = d.datum.fontSize;

    // can not be placed if the mark is not visible in the graph bound
    if (boundary[2] < 0 || boundary[5] < 0 || boundary[0] > width || boundary[3] > height) {
      return false;
    }
    let textWidth = d.textWidth ?? 0,
      dx,
      dy,
      isInside,
      sizeFactor,
      insideFactor,
      x1,
      x2,
      y1,
      y2,
      xc,
      yc,
      _x1,
      _x2,
      _y1,
      _y2;

    // for each anchor and offset
    for (let i = 0; i < n; ++i) {
      dx = (anchors[i] & 0x3) - 1;
      dy = (anchors[i] >>> 0x2 & 0x3) - 1;
      isInside = dx === 0 && dy === 0 || offsets[i] < 0;
      sizeFactor = dx && dy ? Math.SQRT1_2 : 1;
      insideFactor = offsets[i] < 0 ? -1 : 1;
      x1 = boundary[1 + dx] + offsets[i] * dx * sizeFactor;
      yc = boundary[4 + dy] + insideFactor * textHeight * dy / 2 + offsets[i] * dy * sizeFactor;
      y1 = yc - textHeight / 2;
      y2 = yc + textHeight / 2;
      _x1 = $(x1);
      _y1 = $(y1);
      _y2 = $(y2);
      if (!textWidth) {
        // to avoid finding width of text label,
        if (!test(_x1, _x1, _y1, _y2, bm0, bm1, x1, x1, y1, y2, boundary, isInside)) {
          // skip this anchor/offset option if we fail to place a label with 1px width
          continue;
        } else {
          // Otherwise, find the label width
          textWidth = textMetrics.width(d.datum, d.datum.text);
        }
      }
      xc = x1 + insideFactor * textWidth * dx / 2;
      x1 = xc - textWidth / 2;
      x2 = xc + textWidth / 2;
      _x1 = $(x1);
      _x2 = $(x2);
      if (test(_x1, _x2, _y1, _y2, bm0, bm1, x1, x2, y1, y2, boundary, isInside)) {
        // place label if the position is placeable
        d.x = !dx ? xc : dx * insideFactor < 0 ? x2 : x1;
        d.y = !dy ? yc : dy * insideFactor < 0 ? y2 : y1;
        d.align = Aligns[dx * insideFactor + 1];
        d.baseline = Baselines[dy * insideFactor + 1];
        bm0.setRange(_x1, _y1, _x2, _y2);
        return true;
      }
    }
    return false;
  };
}

// Test if a label with the given dimensions can be added without overlap
function test(_x1, _x2, _y1, _y2, bm0, bm1, x1, x2, y1, y2, boundary, isInside) {
  return !(bm0.outOfBounds(_x1, _y1, _x2, _y2) || (isInside && bm1 || bm0).getRange(_x1, _y1, _x2, _y2));
}

// 8-bit representation of anchors
const TOP = 0x0,
  MIDDLE = 0x4,
  BOTTOM = 0x8,
  LEFT = 0x0,
  CENTER = 0x1,
  RIGHT = 0x2;

// Mapping from text anchor to number representation
const anchorCode = {
  'top-left': TOP + LEFT,
  'top': TOP + CENTER,
  'top-right': TOP + RIGHT,
  'left': MIDDLE + LEFT,
  'middle': MIDDLE + CENTER,
  'right': MIDDLE + RIGHT,
  'bottom-left': BOTTOM + LEFT,
  'bottom': BOTTOM + CENTER,
  'bottom-right': BOTTOM + RIGHT
};
const placeAreaLabel = {
  'naive': placeAreaLabelNaive,
  'reduced-search': placeAreaLabelReducedSearch,
  'floodfill': placeAreaLabelFloodFill
};
function labelLayout (texts, size, compare, offset, anchor, avoidMarks, avoidBaseMark, lineAnchor, markIndex, padding, method) {
  // early exit for empty data
  if (!texts.length) return texts;
  const positions = Math.max(offset.length, anchor.length),
    offsets = getOffsets(offset, positions),
    anchors = getAnchors(anchor, positions),
    marktype = markType(texts[0].datum),
    grouptype = marktype === 'group' && texts[0].datum.items[markIndex].marktype,
    isGroupArea = grouptype === 'area',
    boundary = markBoundary(marktype, grouptype, lineAnchor, markIndex),
    infPadding = padding === null || padding === Infinity,
    isNaiveGroupArea = isGroupArea && method === 'naive';
  let maxTextWidth = -1,
    maxTextHeight = -1;

  // prepare text mark data for placing
  const data = texts.map(d => {
    const textWidth = infPadding ? textMetrics.width(d, d.text) : undefined;
    maxTextWidth = Math.max(maxTextWidth, textWidth);
    maxTextHeight = Math.max(maxTextHeight, d.fontSize);
    return {
      datum: d,
      opacity: 0,
      x: undefined,
      y: undefined,
      align: undefined,
      baseline: undefined,
      boundary: boundary(d),
      textWidth
    };
  });
  padding = padding === null || padding === Infinity ? Math.max(maxTextWidth, maxTextHeight) + Math.max(...offset) : padding;
  const $ = scaler(size[0], size[1], padding);
  let bitmaps;
  if (!isNaiveGroupArea) {
    // sort labels in priority order, if comparator is provided
    if (compare) {
      data.sort((a, b) => compare(a.datum, b.datum));
    }

    // flag indicating if label can be placed inside its base mark
    let labelInside = false;
    for (let i = 0; i < anchors.length && !labelInside; ++i) {
      // label inside if anchor is at center
      // label inside if offset to be inside the mark bound
      labelInside = anchors[i] === 0x5 || offsets[i] < 0;
    }

    // extract data information from base mark when base mark is to be avoided
    // base mark is implicitly avoided if it is a group area
    const baseMark = (marktype && avoidBaseMark || isGroupArea) && texts.map(d => d.datum);

    // generate bitmaps for layout calculation
    bitmaps = avoidMarks.length || baseMark ? markBitmaps($, baseMark || [], avoidMarks, labelInside, isGroupArea) : baseBitmaps($, avoidBaseMark && data);
  }

  // generate label placement function
  const place = isGroupArea ? placeAreaLabel[method]($, bitmaps, avoidBaseMark, markIndex) : placeMarkLabel($, bitmaps, anchors, offsets);

  // place all labels
  data.forEach(d => d.opacity = +place(d));
  return data;
}
function getOffsets(_, count) {
  const offsets = new Float64Array(count),
    n = _.length;
  for (let i = 0; i < n; ++i) offsets[i] = _[i] || 0;
  for (let i = n; i < count; ++i) offsets[i] = offsets[n - 1];
  return offsets;
}
function getAnchors(_, count) {
  const anchors = new Int8Array(count),
    n = _.length;
  for (let i = 0; i < n; ++i) anchors[i] |= anchorCode[_[i]];
  for (let i = n; i < count; ++i) anchors[i] = anchors[n - 1];
  return anchors;
}
function markType(item) {
  return item && item.mark && item.mark.marktype;
}

/**
 * Factory function for function for getting base mark boundary, depending
 * on mark and group type. When mark type is undefined, line or area: boundary
 * is the coordinate of each data point. When base mark is grouped line,
 * boundary is either at the start or end of the line depending on the
 * value of lineAnchor. Otherwise, use bounds of base mark.
 */
function markBoundary(marktype, grouptype, lineAnchor, markIndex) {
  const xy = d => [d.x, d.x, d.x, d.y, d.y, d.y];
  if (!marktype) {
    return xy; // no reactive geometry
  } else if (marktype === 'line' || marktype === 'area') {
    return d => xy(d.datum);
  } else if (grouptype === 'line') {
    return d => {
      const items = d.datum.items[markIndex].items;
      return xy(items.length ? items[lineAnchor === 'start' ? 0 : items.length - 1] : {
        x: NaN,
        y: NaN
      });
    };
  } else {
    return d => {
      const b = d.datum.bounds;
      return [b.x1, (b.x1 + b.x2) / 2, b.x2, b.y1, (b.y1 + b.y2) / 2, b.y2];
    };
  }
}

const Output = ['x', 'y', 'opacity', 'align', 'baseline'];
const Anchors = ['top-left', 'left', 'bottom-left', 'top', 'bottom', 'top-right', 'right', 'bottom-right'];

/**
 * Compute text label layout to annotate marks.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<number>} params.size - The size of the layout, provided as a [width, height] array.
 * @param {function(*,*): number} [params.sort] - An optional
 *   comparator function for sorting label data in priority order.
 * @param {Array<string>} [params.anchor] - Label anchor points relative to the base mark bounding box.
 *   The available options are 'top-left', 'left', 'bottom-left', 'top',
 *   'bottom', 'top-right', 'right', 'bottom-right', 'middle'.
 * @param {Array<number>} [params.offset] - Label offsets (in pixels) from the base mark bounding box.
 *   This parameter is parallel to the list of anchor points.
 * @param {number | null} [params.padding=0] - The amount (in pixels) that a label may exceed the layout size.
 *   If this parameter is null, a label may exceed the layout size without any boundary.
 * @param {string} [params.lineAnchor='end'] - For group line mark labels only, indicates the anchor
 *   position for labels. One of 'start' or 'end'.
 * @param {string} [params.markIndex=0] - For group mark labels only, an index indicating
 *   which mark within the group should be labeled.
 * @param {Array<number>} [params.avoidMarks] - A list of additional mark names for which the label
 *   layout should avoid overlap.
 * @param {boolean} [params.avoidBaseMark=true] - Boolean flag indicating if labels should avoid
 *   overlap with the underlying base mark being labeled.
 * @param {string} [params.method='naive'] - For area make labels only, a method for
 *   place labels. One of 'naive', 'reduced-search', or 'floodfill'.
 * @param {Array<string>} [params.as] - The output fields written by the transform.
 *   The default is ['x', 'y', 'opacity', 'align', 'baseline'].
 */
function Label(params) {
  Transform.call(this, null, params);
}
Label.Definition = {
  type: 'Label',
  metadata: {
    modifies: true
  },
  params: [{
    name: 'size',
    type: 'number',
    array: true,
    length: 2,
    required: true
  }, {
    name: 'sort',
    type: 'compare'
  }, {
    name: 'anchor',
    type: 'string',
    array: true,
    default: Anchors
  }, {
    name: 'offset',
    type: 'number',
    array: true,
    default: [1]
  }, {
    name: 'padding',
    type: 'number',
    default: 0,
    null: true
  }, {
    name: 'lineAnchor',
    type: 'string',
    values: ['start', 'end'],
    default: 'end'
  }, {
    name: 'markIndex',
    type: 'number',
    default: 0
  }, {
    name: 'avoidBaseMark',
    type: 'boolean',
    default: true
  }, {
    name: 'avoidMarks',
    type: 'data',
    array: true
  }, {
    name: 'method',
    type: 'string',
    default: 'naive'
  }, {
    name: 'as',
    type: 'string',
    array: true,
    length: Output.length,
    default: Output
  }]
};
inherits(Label, Transform, {
  transform(_, pulse) {
    function modp(param) {
      const p = _[param];
      return isFunction(p) && pulse.modified(p.fields);
    }
    const mod = _.modified();
    if (!(mod || pulse.changed(pulse.ADD_REM) || modp('sort'))) return;
    if (!_.size || _.size.length !== 2) {
      error('Size parameter should be specified as a [width, height] array.');
    }
    const as = _.as || Output;

    // run label layout
    labelLayout(pulse.materialize(pulse.SOURCE).source || [], _.size, _.sort, array(_.offset == null ? 1 : _.offset), array(_.anchor || Anchors), _.avoidMarks || [], _.avoidBaseMark !== false, _.lineAnchor || 'end', _.markIndex || 0, _.padding === undefined ? 0 : _.padding, _.method || 'naive').forEach(l => {
      // write layout results to data stream
      const t = l.datum;
      t[as[0]] = l.x;
      t[as[1]] = l.y;
      t[as[2]] = l.opacity;
      t[as[3]] = l.align;
      t[as[4]] = l.baseline;
    });
    return pulse.reflow(mod).modifies(as);
  }
});

export { Label as label };
