import boundStroke from '../bound/boundStroke';
import context from '../bound/boundContext';
import {drawAll} from '../util/canvas/draw';
import {pickPath} from '../util/canvas/pick';
import translateItem from '../util/svg/translateItem';

export default function(type, shape) {

  function attr(emit, item) {
    emit('transform', translateItem(item));
    emit('d', shape(null, item));
  }

  function bound(bounds, item) {
    shape(context(bounds), item);
    return boundStroke(bounds, item)
      .translate(item.x || 0, item.y || 0);
  }

  function draw(context, item) {
    var x = item.x || 0,
        y = item.y || 0;
    context.translate(x, y);
    context.beginPath();
    shape(context, item);
    context.translate(-x, -y);
  }

  return {
    type:   type,
    tag:    'path',
    nested: false,
    attr:   attr,
    bound:  bound,
    draw:   drawAll(draw),
    pick:   pickPath(draw)
  };

}
