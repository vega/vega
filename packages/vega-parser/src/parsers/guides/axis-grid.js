import {Left, Top, Bottom, Value} from './constants';
import guideMark from './guide-mark';
import {RuleMark} from '../marks/marktypes';
import {AxisGridRole} from '../marks/roles';

export default function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? 1 : -1,
      offset = sign * spec.offset || 0,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickPos;

  encode.enter = enter = {
    opacity: zero,
    stroke: {value: config.gridColor},
    strokeWidth: {value: config.gridWidth},
    strokeDash: {value: config.gridDash}
  };

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: config.gridOpacity}
  };

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   config.bandPosition,
    round:  config.tickRound,
    extra:  config.tickExtra
  };

  if (orient === Top || orient === Bottom) {
    enter.y = {value: offset};
    update.y2 = enter.y2 = {signal: 'height', mult: sign, offset: offset};
    update.x = enter.x = exit.x = tickPos;
  } else {
    enter.x = {value: offset};
    update.x2 = enter.x2 = {signal: 'width', mult: sign, offset: offset};
    update.y = enter.y = exit.y = tickPos;
  }

  return guideMark(RuleMark, AxisGridRole, Value, dataRef, encode, userEncode);
}
