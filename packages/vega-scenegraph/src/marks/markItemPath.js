import boundStroke from '../bound/boundStroke.js';
import context from '../bound/boundContext.js';
import {intersectPath} from '../util/intersect.js';
import {drawAll} from '../util/canvas/draw.js';
import {pickPath} from '../util/canvas/pick.js';
import place from '../util/canvas/place.js';
import {rotateItem} from '../util/svg/transform.js';
import {DegToRad} from '../util/constants.js';

export default function(type, shape, isect, bound) {

  function attr(emit, item) {
    emit('transform', rotateItem(item));
    emit('d', shape(null, item));
  }

  function defaultBound(bounds, item) {
    shape(context(bounds, item.angle), item);
    return boundStroke(bounds, item, true).translate(item.x || 0, item.y || 0);
  }

  function draw(context, item) {
    var a = (item.angle || 0) * DegToRad;

    // place the path rather than move the canvas matrix there and back (#4409)
    context.beginPath();
    shape(place(context, item.x || 0, item.y || 0, a), item);
  }

  return {
    type:   type,
    tag:    'path',
    nested: false,
    attr:   attr,
    bound:  bound || defaultBound,
    draw:   drawAll(draw),
    pick:   pickPath(draw),
    isect:  isect || intersectPath(draw)
  };

}
