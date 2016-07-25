import {Top, Bottom} from './constants';
import {extend} from 'vega-util';

export default function(spec, config, encode, dataRef) {
  encode = encode || {};
  var orient = spec.orient,
      zero = {value: 0},
      enter, exit, update;

  enter = {
    opacity: zero,
    stroke: {value: config.axisTickColor},
    strokeWidth: {value: config.axisTickWidth}
  };

  exit = {
    opacity: zero
  };

  update = {
    opacity: {value: 1}
  };

  if (orient === Top || orient === Bottom) {
    enter.y = {value: 0.5};
    update.x = enter.x = {scale: spec.scale, range: 0, offset: 0.5};
    update.x2 = enter.x2 = {scale: spec.scale, range: 1, offset: 0.5};
  } else {
    enter.x = {value: 0.5};
    update.y = enter.y = {scale: spec.scale, range: 0, offset: 0.5};
    update.y2 = enter.y2 = {scale: spec.scale, range: 1, offset: 0.5};
  }

  return {
    type: 'rule',
    from: dataRef,
    interactive: false,
    encode: {
      exit:   extend(exit, encode.exit),
      enter:  extend(enter, encode.enter),
      update: extend(update, encode.update)
    }
  };
}
