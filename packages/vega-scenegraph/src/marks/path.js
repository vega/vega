import boundStroke from '../bound/boundStroke';
import context from '../bound/boundContext';
import pathParse from '../path/parse';
import pathRender from '../path/render';
import translateItem from '../util/svg/translateItem';
import {drawAll} from '../util/canvas/draw';
import {pickPath} from '../util/canvas/pick';

function attr(emit, item) {
  emit('transform', translateItem(item));
  emit('d', item.path);
}

function path(context, item) {
  if (item.path == null) return true;
  var path = item.pathCache || (item.pathCache = pathParse(item.path));
  pathRender(context, path, item.x, item.y);
}

function bound(bounds, item) {
  return path(context(bounds), item)
    ? bounds.set(0, 0, 0, 0)
    : boundStroke(item, bounds);
}

export default {
  type:   'path',
  tag:    'path',
  nested: false,
  attr:   attr,
  bound:  bound,
  draw:   drawAll(path),
  pick:   pickPath(path)
};
