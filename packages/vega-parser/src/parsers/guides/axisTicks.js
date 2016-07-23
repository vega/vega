import {Top, Left, Bottom, Value, Label} from './constants';
import encoder from './encoder';
import {extend} from 'vega-util';

export default function(spec, config, encode, dataRef) {
  encode = encode || {};
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      size = spec.tickSize != null ? spec.tickSize : config.axisTickSize,
      zero = {value: 0},
      enter, exit, update, tickSize, tickPos;

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

  tickSize = extend(encoder(size), {mult: sign});

  tickPos = {scale: spec.scale, field: Value, band: 0.5, offset: 0.5};

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
    key:  Label,
    from: dataRef,
    interactive: false,
    encode: {
      exit:   extend(exit, encode.exit),
      enter:  extend(enter, encode.enter),
      update: extend(update, encode.update)
    }
  };
}
