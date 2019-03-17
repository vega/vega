/*eslint no-fallthrough: "warn" */
/*eslint no-console: "warn"*/
import {Marks} from 'vega-scenegraph';

const DIV = 0x5;
const MOD = 0x1f;
const SIZE = 0x20;
const right0 = new Uint32Array(SIZE + 1);
const right1 = new Uint32Array(SIZE + 1);

right1[0] = 0x0;
right0[0] = ~right1[0];
for (let i = 1; i <= SIZE; i++) {
  right1[i] = (right1[i - 1] << 0x1) | 0x1;
  right0[i] = ~right1[i];
}

function applyMark(array, index, mask) {
  array[index] |= mask;
}

function applyUnmark(array, index, mask) {
  array[index] &= mask;
}

export default class BitMap {
  constructor(width, height, padding) {
    this.pixelRatio = Math.sqrt((width * height) / 1000000.0);

    // bound pixelRatio to be not less than 1
    if (this.pixelRatio < 1) {
      this.pixelRatio = 1;
    }

    this.padding = padding;

    this.width = ~~((width + 2 * padding + this.pixelRatio) / this.pixelRatio);
    this.height = ~~((height + 2 * padding + this.pixelRatio) / this.pixelRatio);

    this.array = new Uint32Array(~~((this.width * this.height + SIZE) / SIZE));
  }

  /**
   * Get pixel ratio between real size and bitmap size
   * @returns pixel ratio between real size and bitmap size
   */
  getPixelRatio() {
    return this.pixelRatio;
  }

  /**
   * Scale real pixel in the chart into bitmap pixel
   * @param realPixel the real pixel to be scaled down
   * @returns scaled pixel
   */
  scalePixel(realPixel) {
    return ~~((realPixel + this.padding) / this.pixelRatio);
  }

  markScaled(x, y) {
    const mapIndex = y * this.width + x;
    applyMark(this.array, mapIndex >>> DIV, 1 << (mapIndex & MOD));
  }

  mark(x, y) {
    this.markScaled(this.scalePixel(x), this.scalePixel(y));
  }

  unmarkScaled(x, y) {
    const mapIndex = y * this.width + x;
    applyUnmark(this.array, mapIndex >>> DIV, ~(1 << (mapIndex & MOD)));
  }

  unmark(x, y) {
    this.unmarkScaled(this.scalePixel(x), this.scalePixel(y));
  }

  getScaled(x, y) {
    const mapIndex = y * this.width + x;
    return this.array[mapIndex >>> DIV] & (1 << (mapIndex & MOD));
  }

  get(x, y) {
    return this.getScaled(this.scalePixel(x), this.scalePixel(y));
  }

  markInRangeScaled(x, y, x2, y2) {
    let start, end, indexStart, indexEnd;
    for (; y <= y2; y++) {
      start = y * this.width + x;
      end = y * this.width + x2;
      indexStart = start >>> DIV;
      indexEnd = end >>> DIV;
      if (indexStart === indexEnd) {
        applyMark(this.array, indexStart, right0[start & MOD] & right1[(end & MOD) + 1]);
      } else {
        applyMark(this.array, indexStart, right0[start & MOD]);
        applyMark(this.array, indexEnd, right1[(end & MOD) + 1]);

        for (let i = indexStart + 1; i < indexEnd; i++) {
          applyMark(this.array, i, 0xffffffff);
        }
      }
    }
  }

  markInRange(x, y, x2, y2) {
    return this.markInRangeScaled(this.scalePixel(x), this.scalePixel(y), this.scalePixel(x2), this.scalePixel(y2));
  }

  unmarkInRangeScaled(x, y, x2, y2) {
    let start, end, indexStart, indexEnd;
    for (; y <= y2; y++) {
      start = y * this.width + x;
      end = y * this.width + x2;
      indexStart = start >>> DIV;
      indexEnd = end >>> DIV;
      if (indexStart === indexEnd) {
        applyUnmark(this.array, indexStart, right1[start & MOD] | right0[(end & MOD) + 1]);
      } else {
        applyUnmark(this.array, indexStart, right1[start & MOD]);
        applyUnmark(this.array, indexEnd, right0[(end & MOD) + 1]);

        for (let i = indexStart + 1; i < indexEnd; i++) {
          applyUnmark(this.array, i, 0x0);
        }
      }
    }
  }

  unmarkInRange(x, y, x2, y2) {
    return this.unmarkInRangeScaled(this.scalePixel(x), this.scalePixel(y), this.scalePixel(x2), this.scalePixel(y2));
  }

  getInRangeScaled(x, y, x2, y2) {
    let start, end, indexStart, indexEnd;
    for (; y <= y2; y++) {
      start = y * this.width + x;
      end = y * this.width + x2;
      indexStart = start >>> DIV;
      indexEnd = end >>> DIV;
      if (indexStart === indexEnd) {
        if (this.array[indexStart] & right0[start & MOD] & right1[(end & MOD) + 1]) {
          return true;
        }
      } else {
        if (this.array[indexStart] & right0[start & MOD]) {
          return true;
        }
        if (this.array[indexEnd] & right1[(end & MOD) + 1]) {
          return true;
        }

        for (let i = indexStart + 1; i < indexEnd; i++) {
          if (this.array[i]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getInRange(x, y, x2, y2) {
    return this.getInRangeScaled(this.scalePixel(x), this.scalePixel(y), this.scalePixel(x2), this.scalePixel(y2));
  }

  searchOutOfBound(x, y, x2, y2) {
    return x < 0 || y < 0 || y2 >= this.height || x2 >= this.width;
  }
}

// static function

// bit mask for getting first 2 bytes of alpha value
const ALPHA_MASK = 0xff000000;

// alpha value equivalent to opacity 0.0625
const INSIDE_OPACITY_IN_ALPHA = 0x10000000;
const INSIDE_OPACITY = 0.0625;

/**
 * Get bitmaps and fill the with mark information from data
 * @param {array} data data of labels to be placed
 * @param {array} size size of chart in format [width, height]
 * @param {string} marktype marktype of the base mark
 * @param {bool} avoidBaseMark a flag if base mark is to be avoided
 * @param {array} avoidMarks array of mark data to be avoided
 * @param {bool} labelInside a flag if label to be placed inside mark or not
 * @param {number} padding padding from the boundary of the chart
 *
 * @returns array of 2 bitmaps:
 *          - first bitmap is filled with all the avoiding marks
 *          - second bitmap is filled with borders of all the avoiding marks (second bit map can be
 *            undefined if checking border of base mark is not needed when not avoiding any mark)
 */
export function prepareBitmap(data, size, marktype, avoidBaseMark, avoidMarks, labelInside, padding) {
  const isGroupArea = marktype === 'group' && data[0].datum.datum.items[0].marktype === 'area';
  const width = size[0];
  const height = size[1];
  const n = data.length;

  // extract data information from base mark when base mark is to be avoid
  // or base mark is implicitly avoid when base mark is group area
  if (marktype && (avoidBaseMark || isGroupArea)) {
    const items = new Array(n);
    for (let i = 0; i < n; i++) {
      items[i] = data[i].datum.datum;
    }
    avoidMarks.push(items);
  }

  if (avoidMarks.length) {
    // when there is at least one mark to be avoided
    const context = writeToCanvas(avoidMarks, width, height, labelInside || isGroupArea);
    return writeToBitMaps(context, width, height, labelInside, isGroupArea, padding);
  } else {
    const bitMap = new BitMap(width, height, padding);
    if (avoidBaseMark) {
      // when there is no base mark but data points are to be avoided
      for (let i = 0; i < n; i++) {
        const d = data[i];
        bitMap.mark(d.markBound[0], d.markBound[3]);
      }
    }
    return [bitMap, undefined];
  }
}

/**
 * Write marks to be avoided to canvas to be written to bitmap later
 * @param {array} avoidMarks array of mark data to be avoided
 * @param {number} width width of the chart
 * @param {number} height height of the chart
 * @param {bool} labelInside a flag if label to be placed inside mark or not
 *
 * @returns canvas context, to which all avoiding marks are drawn
 */
function writeToCanvas(avoidMarks, width, height, labelInside) {
  const m = avoidMarks.length;
  // const c = document.getElementById('canvas-render'); // debugging canvas
  const c = document.createElement('canvas');
  const context = c.getContext('2d');
  let originalItems, itemsLen;
  c.setAttribute('width', width);
  c.setAttribute('height', height);

  // draw every avoiding marks into canvas
  for (let i = 0; i < m; i++) {
    originalItems = avoidMarks[i];
    itemsLen = originalItems.length;
    if (!itemsLen) {
      continue;
    }

    if (originalItems[0].mark.marktype !== 'group') {
      drawMark(context, originalItems, labelInside);
    } else {
      drawGroup(context, originalItems, labelInside);
    }
  }

  return context;
}

/**
 * Write avoid marks from drawn canvas to bitmap
 * @param {object} context canvas context, to which all avoiding marks are drawn
 * @param {number} width width of the chart
 * @param {number} height height of the chart
 * @param {bool} labelInside a flag if label to be placed inside mark or not
 * @param {bool} isGroupArea a flag if the base mark if group area
 * @param {number} padding padding from the boundary of the chart
 *
 * @returns array of 2 bitmaps:
 *          - first bitmap is filled with all the avoiding marks
 *          - second bitmap is filled with borders of all the avoiding marks
 */
function writeToBitMaps(context, width, height, labelInside, isGroupArea, padding) {
  const layer1 = new BitMap(width, height, padding);
  const layer2 = (labelInside || isGroupArea) && new BitMap(width, height, padding);
  const imageData = context.getImageData(0, 0, width, height);
  const canvasBuffer = new Uint32Array(imageData.data.buffer);
  let x, y, alpha;

  if (isGroupArea) {
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        alpha = canvasBuffer[y * width + x] & ALPHA_MASK;
        // only fill second layer for group area because labels are only not allowed to place over
        // border of area
        if (alpha && alpha ^ INSIDE_OPACITY_IN_ALPHA) {
          layer2.mark(x, y);
        }
      }
    }
  } else {
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        alpha = canvasBuffer[y * width + x] & ALPHA_MASK;
        if (alpha) {
          // fill first layer if there is something in canvas in that location
          layer1.mark(x, y);

          // fill second layer if there is a border in canvas in that location
          // and label can be placed inside
          if (labelInside && alpha ^ INSIDE_OPACITY_IN_ALPHA) {
            layer2.mark(x, y);
          }
        }
      }
    }
  }
  return [layer1, layer2];
}

/**
 * Draw mark into canvas
 * @param {object} context canvas context, to which all avoiding marks are drawn
 * @param {array} originalItems mark to be drawn into canvas
 * @param {bool} labelInside a flag if label to be placed inside mark or not
 */
function drawMark(context, originalItems, labelInside) {
  const n = originalItems.length;
  let items;
  if (labelInside) {
    items = new Array(n);
    for (let i = 0; i < n; i++) {
      items[i] = prepareMarkItem(originalItems[i]);
    }
  } else {
    items = originalItems;
  }

  // draw items into canvas
  Marks[items[0].mark.marktype].draw(context, {items: items}, null);
}

/**
 * draw group of marks into canvas
 * @param {object} context canvas context, to which all avoiding marks are drawn
 * @param {array} groups group of marks to be drawn into canvas
 * @param {bool} labelInside a flag if label to be placed inside mark or not
 */
function drawGroup(context, groups, labelInside) {
  const n = groups.length;
  let marks;
  for (let i = 0; i < n; i++) {
    marks = groups[i].items;
    for (let j = 0; j < marks.length; j++) {
      const g = marks[j];
      if (g.marktype !== 'group') {
        drawMark(context, g.items, labelInside);
      } else {
        // recursivly draw group of marks
        drawGroup(context, g.items, labelInside);
      }
    }
  }
}

/**
 * Prepare item before drawing into canvas (setting stroke and opacity)
 * @param {object} originalItem item to be prepared
 *
 * @returns prepared item
 */
function prepareMarkItem(originalItem) {
  const item = {};
  for (const key in originalItem) {
    item[key] = originalItem[key];
  }
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

// debugging tools

export function printBitMap(bitmap, id) {
  if (!arguments.length) {
    id = 'bitmap';
  }

  let x, y;
  const canvas = document.getElementById(id);
  if (!canvas) {
    return;
  }

  canvas.setAttribute('width', bitmap.width);
  canvas.setAttribute('height', bitmap.height);
  const ctx = canvas.getContext('2d');
  for (y = 0; y < bitmap.height; y++) {
    for (x = 0; x < bitmap.width; x++) {
      if (bitmap.getScaled(x, y)) {
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

export function printBitMapContext(bitmap, ctx) {
  let x, y;
  for (y = 0; y < bitmap.height; y++) {
    for (x = 0; x < bitmap.width; x++) {
      if (bitmap.getScaled(x, y)) {
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}
