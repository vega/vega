import boundStroke from '../bound/boundStroke.js';
import context from '../bound/boundContext.js';
import pathParse from '../path/parse.js';
import pathRender from '../path/render.js';
import {intersectPath} from '../util/intersect.js';
import {drawAll} from '../util/canvas/draw.js';
import {pickPath} from '../util/canvas/pick.js';
import {transformItem} from '../util/svg/transform.js';
import {DegToRad} from '../util/constants.js';

function attr(emit, item) {
  var sx = item.scaleX || 1,
      sy = item.scaleY || 1;
  if (sx !== 1 || sy !== 1) {
    emit('vector-effect', 'non-scaling-stroke');
  }
  emit('transform', transformItem(item));
  emit('d', item.path);
}

function path(context, item) {
  var path = item.path;
  if (path == null) return true;

  var x = item.x || 0,
      y = item.y || 0,
      sx = item.scaleX || 1,
      sy = item.scaleY || 1,
      a = (item.angle || 0) * DegToRad,
      cache = item.pathCache;

  if (!cache || cache.path !== path) {
    (item.pathCache = cache = pathParse(path)).path = path;
  }

  if (a && context.rotate && context.translate) {
    context.translate(x, y);
    context.rotate(a);
    pathRender(context, cache, 0, 0, sx, sy);
    context.rotate(-a);
    context.translate(-x, -y);
  } else {
    pathRender(context, cache, x, y, sx, sy);
  }
}

function bound(bounds, item) {
  return path(context(bounds, item.angle), item)
    ? bounds.set(0, 0, 0, 0)
    : boundStroke(bounds, item, true);
}

export default {
  type:   'path',
  tag:    'path',
  nested: false,
  attr:   attr,
  bound:  bound,
  draw:   drawAll(path),
  pick:   pickPath(path),
  isect:  intersectPath(path)
};
