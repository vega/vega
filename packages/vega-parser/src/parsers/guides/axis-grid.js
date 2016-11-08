import {Left, Top, Bottom, Value} from './constants';
import guideMark from './guide-mark';
import {RuleMark} from '../marks/marktypes';
import {AxisGridRole} from '../marks/roles';

export default function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      vscale = spec.gridScale,
      sign = (orient === Left || orient === Top) ? 1 : -1,
      offset = sign * spec.offset || 0,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickPos, u, v, v2, s;

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

  (orient === Top || orient === Bottom)
    ? (u = 'x', v = 'y', s = 'height')
    : (u = 'y', v = 'x', s = 'width');
  v2 = v + '2',

  update[u] = enter[u] = exit[u] = tickPos;

  if (vscale) {
    enter[v] = {scale: vscale, range: 0, mult: sign, offset: offset};
    update[v2] = enter[v2] = {scale: vscale, range: 1, mult: sign, offset: offset};
  } else {
    enter[v] = {value: offset};
    update[v2] = enter[v2] = {signal: s, mult: sign, offset: offset};
  }

  return guideMark(RuleMark, AxisGridRole, Value, dataRef, encode, userEncode);
}
