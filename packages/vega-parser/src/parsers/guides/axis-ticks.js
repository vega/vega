import {Top, Left, Bottom, Value} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {RuleMark} from '../marks/marktypes';
import {AxisTickRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      zero = {value: 0},
      encode, enter, exit, update, tickSize, tickPos;

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
  addEncode(encode, 'stroke',        lookup('tickColor', spec, config));
  addEncode(encode, 'strokeOpacity', lookup('tickOpacity', spec, config));
  addEncode(encode, 'strokeWidth',   lookup('tickWidth', spec, config));

  tickSize = encoder(size);
  tickSize.mult = sign;

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   lookup('bandPosition', spec, config),
    round:  lookup('tickRound', spec, config),
    extra:  lookup('tickExtra', spec, config),
    offset: lookup('tickOffset', spec, config)
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

  return guideMark(RuleMark, AxisTickRole, null, Value, dataRef, encode, userEncode);
}
