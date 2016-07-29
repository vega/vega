import {Left, Top, Bottom, Value} from './constants';
import guideMark from './guide-mark';

export default function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? 1 : -1,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickPos;

  encode.enter = enter = {
    opacity: zero,
    stroke: {value: config.axisGridColor},
    strokeWidth: {value: config.axisGridWidth}
  };

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   0.5
  };

  if (orient === Top || orient === Bottom) {
    enter.y = zero;
    update.y2 = enter.y2 = {signal: 'height', mult: sign};
    update.x = enter.x = exit.x = tickPos;
  } else {
    enter.x = zero;
    update.x2 = enter.x2 = {signal: 'width', mult: sign};
    update.y = enter.y = exit.y = tickPos;
  }

  return guideMark('rule', 'axis-grid', Value, dataRef, encode, userEncode);
}
