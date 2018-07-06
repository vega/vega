import {Left, Top, Bottom, Value} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {RuleMark} from '../marks/marktypes';
import {AxisGridRole} from '../marks/roles';
import {addEncode} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      vscale = spec.gridScale,
      sign = (orient === Left || orient === Top) ? 1 : -1,
      offset = sign * spec.offset || 0,
      zero = {value: 0},
      encode, enter, exit, update, tickPos, u, v, v2, s;

  encode = {
    enter: enter = {
      opacity: zero
    },
    update: update = {
      opacity: {value: 1}
    },
    exit: exit = {
      opacity: zero
    }
  };
  addEncode(encode, 'stroke',        lookup('gridColor', spec, config));
  addEncode(encode, 'strokeDash',    lookup('gridDash', spec, config));
  addEncode(encode, 'strokeOpacity', lookup('gridOpacity', spec, config));
  addEncode(encode, 'strokeWidth',   lookup('gridWidth', spec, config));

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   lookup('bandPosition', spec, config),
    round:  lookup('tickRound', spec, config),
    extra:  lookup('tickExtra', spec, config),
    offset: lookup('tickOffset', spec, config)
  };

  if (orient === Top || orient === Bottom) {
    u = 'x';
    v = 'y';
    s = 'height';
  } else {
    u = 'y';
    v = 'x';
    s = 'width';
  }
  v2 = v + '2';

  update[u] = enter[u] = exit[u] = tickPos;

  if (vscale) {
    enter[v] = {scale: vscale, range: 0, mult: sign, offset: offset};
    update[v2] = enter[v2] = {scale: vscale, range: 1, mult: sign, offset: offset};
  } else {
    enter[v] = {value: offset};
    update[v2] = enter[v2] = {signal: s, mult: sign, offset: offset};
  }

  return guideMark(RuleMark, AxisGridRole, null, Value, dataRef, encode, userEncode);
}
