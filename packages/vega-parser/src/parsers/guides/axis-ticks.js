import {Top, Left, Bottom, Value, Label} from './constants';
import {encoder} from './encode-util';
import guideMark from './guide-mark';

export default function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      size = spec.tickSize != null ? spec.tickSize : config.axisTickSize,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;

  encode.enter = enter = {
    opacity: zero,
    stroke: {value: config.axisTickColor},
    strokeWidth: {value: config.axisTickWidth}
  };

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  tickSize = encoder(size);
  tickSize.mult = sign;

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   0.5
  };

  if (orient === Top || orient === Bottom) {
    update.y = enter.y = zero;
    update.y2 = enter.y2 = tickSize;
    update.x = enter.x = exit.x = tickPos;
  } else {
    update.x = enter.x = zero;
    update.x2 = enter.x2 = tickSize;
    update.y = enter.y = exit.y = tickPos;
  }

  return guideMark('rule', 'axis-tick', Label, dataRef, encode, userEncode);
}
