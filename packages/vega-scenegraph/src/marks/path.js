import boundStroke from '../bound/boundStroke';
import context from '../bound/boundContext';
import pathParse from '../path/parse';
import pathRender from '../path/render';
import {intersectPath} from '../util/intersect';
import {drawAll} from '../util/canvas/draw';
import {pickPath} from '../util/canvas/pick';
import {transformItem} from '../util/svg/transform';
import {DegToRad} from '../util/constants';

function attr(emit, item) {
  emit('transform', transformItem(item));
  emit('d', item.path);
}

function path(context, item) {
  var path = item.path;
  if (path == null) return true;
  var scaleX = item.scaleX || 1;
  var scaleY = item.scaleY || 1;
  var hasRotate = context.rotate;
  var hasTranslate = context.translate;
  var a = (item.angle || 0) * DegToRad;
  var x = item.x || 0;
  var y = item.y || 0;
  var cache = item.pathCache;
  if (!cache || cache.path !== path) {
    (item.pathCache = cache = pathParse(path)).path = path;
  }
  if(hasTranslate && hasRotate){
    context.translate(x, y);
    if (a) context.rotate(a);
  }

  pathRender(context, cache, hasTranslate ? 0 : x, hasTranslate ? 0 : y, scaleX, scaleY);

  if(hasTranslate && hasRotate){
    if (a) context.rotate(-a);
    context.translate(-x, -y);
  }
}

function bound(bounds, item) {
  var x = item.x || 0,
  y = item.y || 0;
  path(context(bounds), item)
    ? bounds.set(0, 0, 0, 0)
    : boundStroke(bounds, item);
    if (item.angle) {
      bounds.rotate(item.angle * DegToRad, x, y);
    }

  return bounds;
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
