/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import {canvas} from 'vega-canvas';
import {labelWidth, checkCollision} from './Common';

const X_DIR = [-1, -1, 1, 1];
const Y_DIR = [-1, 1, -1, 1];

export default class AreaLabelPlacer {
  constructor(bitmaps, size, avoidBaseMark) {
    this.bm0 = bitmaps[0];
    this.bm1 = bitmaps[1];
    this.bm2 = bitmaps[2];
    this.width = size[0];
    this.height = size[1];
    this.avoidBaseMark = avoidBaseMark;
  }

  place(d) {
    const context = canvas().getContext('2d');
    const items = d.datum.datum.items[0].items;
    const n = items.length;
    const textHeight = d.textHeight;
    const textWidth = labelWidth(context, d.text, textHeight, d.font);
    const pixelRatio = this.bm1.getPixelRatio();
    const stack = new Stack();
    let maxSize = this.avoidBaseMark ? textHeight : 0;
    let labelPlaced = false;
    let labelPlaced2 = false;
    let maxAreaWidth = 0;
    let x1, x2, y1, y2, x, y, _x, _y, lo, hi, mid, areaWidth, coordinate, nextX, nextY;

    for (let i = 0; i < n; i++) {
      x1 = items[i].x;
      y1 = items[i].y;
      x2 = items[i].x2 === undefined ? x1 : items[i].x2;
      y2 = items[i].y2 === undefined ? y1 : items[i].y2;
      stack.push(this.bm0.scalePixel((x1 + x2) / 2.0), this.bm0.scalePixel((y1 + y2) / 2.0));
      while (!stack.isEmpty()) {
        coordinate = stack.pop();
        _x = coordinate[0];
        _y = coordinate[1];
        if (!this.bm0.getScaled(_x, _y) && !this.bm1.getScaled(_x, _y) && !this.bm2.getScaled(_x, _y)) {
          this.bm2.markScaled(_x, _y);
          for (let j = 0; j < 4; j++) {
            nextX = _x + X_DIR[j];
            nextY = _y + Y_DIR[j];
            if (!this.bm2.searchOutOfBound(nextX, nextY, nextX, nextY)) {
              stack.push(nextX, nextY);
            }
          }

          x = _x * pixelRatio - this.bm0.padding;
          y = _y * pixelRatio - this.bm0.padding;
          lo = maxSize;
          hi = this.height; // Todo: make this bound smaller;
          if (
            !checkLabelOutOfBound(x, y, textWidth, textHeight, this.width, this.height) &&
            !collide(x, y, textHeight, textWidth, lo, this.bm0, this.bm1)
          ) {
            while (hi - lo >= 1) {
              mid = (lo + hi) / 2;
              if (collide(x, y, textHeight, textWidth, mid, this.bm0, this.bm1)) {
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
      if (!labelPlaced && !this.avoidBaseMark) {
        areaWidth = Math.abs(x2 - x1 + y2 - y1);
        x = (x1 + x2) / 2.0;
        y = (y1 + y2) / 2.0;
        if (
          areaWidth >= maxAreaWidth &&
          !checkLabelOutOfBound(x, y, textWidth, textHeight, this.width, this.height) &&
          !collide(x, y, textHeight, textWidth, textHeight, this.bm0, null)
        ) {
          maxAreaWidth = areaWidth;
          d.x = x;
          d.y = y;
          labelPlaced2 = true;
        }
      }
    }

    if (labelPlaced || labelPlaced2) {
      x1 = this.bm0.scalePixel(d.x - textWidth / 2.0);
      y1 = this.bm0.scalePixel(d.y - textHeight / 2.0);
      x2 = this.bm0.scalePixel(d.x + textWidth / 2.0);
      y2 = this.bm0.scalePixel(d.y + textHeight / 2.0);
      this.bm0.markInRangeScaled(x1, y1, x2, y2);
      d.align = 'center';
      d.baseline = 'middle';
      return true;
    }

    d.align = 'left';
    d.baseline = 'top';
    return false;
  }
}

function checkLabelOutOfBound(x, y, textWidth, textHeight, width, height) {
  return (
    x - textWidth / 2.0 < 0 || y - textHeight / 2.0 < 0 || x + textWidth / 2.0 > width || y + textHeight / 2.0 > height
  );
}

function collide(x, y, textHeight, textWidth, h, bm0, bm1) {
  const w = (textWidth * h) / (textHeight * 2.0);
  h = h / 2.0;
  const _x1 = bm0.scalePixel(x - w);
  const _x2 = bm0.scalePixel(x + w);
  const _y1 = bm0.scalePixel(y - h);
  const _y2 = bm0.scalePixel(y + h);

  return (
    bm0.searchOutOfBound(_x1, _y1, _x2, _y2) ||
    checkCollision(_x1, _y1, _x2, _y2, bm0) ||
    (bm1 && checkCollision(_x1, _y1, _x2, _y2, bm1))
  );
}

class Stack {
  constructor() {
    this.size = 100;
    this.xStack = new Int32Array(this.size);
    this.yStack = new Int32Array(this.size);
    this.idx = 0;
  }

  push(x, y) {
    if (this.idx === this.size - 1) resizeStack(this);
    this.xStack[this.idx] = x;
    this.yStack[this.idx] = y;
    this.idx++;
  }

  pop() {
    if (this.idx > 0) {
      this.idx--;
      return [this.xStack[this.idx], this.yStack[this.idx]];
    } else {
      return null;
    }
  }

  isEmpty() {
    return this.idx <= 0;
  }
}

function resizeStack(obj) {
  const newXStack = new Int32Array(obj.size * 2);
  const newYStack = new Int32Array(obj.size * 2);

  for (let i = 0; i < obj.idx; i++) {
    newXStack[i] = obj.xStack[i];
    newYStack[i] = obj.yStack[i];
  }
  obj.xStack = newXStack;
  obj.yStack = newYStack;
  obj.size *= 2;
}
