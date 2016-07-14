import {Top, Left, Bottom, Value} from './constants';

export default function(spec, config, dataRef) {
  var orient = spec.orient,
      size = +spec.tickSize || config.axisTickSize,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      zero = {value: 0},
      tickSize = {value: sign * size},
      tickPos = {scale: spec.scale, field: Value, band: 0.5, offset: 0.5},
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
    update.y = enter.y = zero;
    update.y2 = enter.y2 = tickSize;
    update.x = enter.x = exit.x = tickPos;
  } else {
    update.x = enter.x = zero;
    update.x2 = enter.x2 = tickSize;
    update.y = enter.y = exit.y = tickPos;
  }

  return {
    type: 'rule',
    key:  Value,
    from: dataRef,
    interactive: false,
    encode: {enter: enter, exit: exit, update: update}
  };
}
