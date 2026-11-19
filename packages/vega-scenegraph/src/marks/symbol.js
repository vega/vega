import Bounds from '../Bounds.js';
import boundContext from '../bound/boundContext.js';
import boundStroke from '../bound/boundStroke.js';
import {DefaultSymbolSize, symbol} from '../path/shapes.js';
import {intersectPoint} from '../util/intersect.js';
import markItemPath from './markItemPath.js';

const unitBounds = Object.create(null);

function unitBox(shape) {
  let box = unitBounds[shape];

  if (box === undefined) {
    const b = new Bounds();
    symbol(boundContext(b, 0), {shape, size: 4}); // sqrt(4) / 2 = 1, a unit box
    box = unitBounds[shape] = [b.x1, b.y1, b.x2, b.y2];
  }

  return box;
}

function bound(bounds, item) {
  const shape = item.shape || 'circle';

  if (item.angle && shape !== 'circle') {
    symbol(boundContext(bounds, item.angle), item);
  } else {
    const u = unitBox(shape);
    const r = Math.sqrt(item.size ?? DefaultSymbolSize) / 2;

    if (r >= 0) {
      bounds.set(u[0] * r, u[1] * r, u[2] * r, u[3] * r);
    } else {
      bounds.clear();
    }
  }

  return boundStroke(bounds, item, true).translate(item.x || 0, item.y || 0);
}

export default markItemPath('symbol', symbol, intersectPoint, bound);
