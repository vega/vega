import boundStroke from '../bound/boundStroke';
import context from '../bound/boundContext';
import {intersectPath} from '../util/intersect';
import {drawAll} from '../util/canvas/draw';
import {pickPath} from '../util/canvas/pick';
import {rotateItem} from '../util/svg/transform';
import {DegToRad} from '../util/constants';

export default function(type, shape, isect) {

  function attr(emit, item) {
    emit('transform', rotateItem(item));
    emit('d', shape(null, item));
  }

  function bound(bounds, item) {
    shape(context(bounds, item.angle), item);
    return boundStroke(bounds, item).translate(item.x || 0, item.y || 0);
  }

  function draw(context, item) {
    var x = item.x || 0,
        y = item.y || 0,
        a = item.angle || 0;

    context.translate(x, y);
    if (a) context.rotate(a *= DegToRad);
    context.beginPath();
    shape(context, item);
    if (a) context.rotate(-a);
    context.translate(-x, -y);
  }

  return {
    type:   type,
    tag:    'path',
    nested: false,
    attr:   attr,
    bound:  bound,
    draw:   drawAll(draw),
    pick:   pickPath(draw),
    isect:  isect || intersectPath(draw)
  };

}
