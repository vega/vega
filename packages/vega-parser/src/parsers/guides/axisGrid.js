import {Top, Bottom, Value} from './constants';
import {extend} from 'vega-util';

export default function(spec, config, encode, dataRef) {
  encode = encode || {};
  var orient = spec.orient,
      zero = {value: 0},
      enter, exit, update, tickPos;

  enter = {
    opacity: zero,
    stroke: {value: config.axisGridColor},
    strokeWidth: {value: config.axisGridWidth}
  };

  exit = {
    opacity: zero
  };

  update = {
    opacity: {value: 1}
  };

  tickPos = {scale: spec.scale, field: Value, band: 0.5, offset: 0.5};

  if (orient === Top || orient === Bottom) {
    enter.y = {value: 0.5};
    update.y2 = enter.y2 = {signal: 'height', offset: 0.5};
    update.x = enter.x = exit.x = tickPos;
  } else {
    enter.x = {value: 0.5};
    update.x2 = enter.x2 = {signal: 'width', offset: 0.5};
    update.y = enter.y = exit.y = tickPos;
  }

  return {
    type: 'rule',
    key:  Value,
    from: dataRef,
    interactive: false,
    encode: {
      exit:   extend(exit, encode.exit),
      enter:  extend(enter, encode.enter),
      update: extend(update, encode.update)
    }
  };
}
