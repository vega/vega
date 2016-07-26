import {Top, Bottom} from './constants';
import guideMark from './guide-mark';

export default function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    stroke: {value: config.axisTickColor},
    strokeWidth: {value: config.axisTickWidth}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  if (orient === Top || orient === Bottom) {
    enter.y = {value: 0.5};
    update.x = enter.x = position(spec, 0);
    update.x2 = enter.x2 = position(spec, 1);
  } else {
    enter.x = {value: 0.5};
    update.y = enter.y = position(spec, 0);
    update.y2 = enter.y2 = position(spec, 1);
  }

  return guideMark('rule', 'axis-domain', null, dataRef, encode, userEncode);
}

function position(spec, pos) {
  return {scale: spec.scale, range: pos, offset: 0.5};
}
