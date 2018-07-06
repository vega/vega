import {Top, Bottom} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {RuleMark} from '../marks/marktypes';
import {AxisDomainRole} from '../marks/roles';
import {addEncode} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      zero = {value: 0},
      encode, enter, update, u, u2, v;

  encode = {
    enter: enter = {
      opacity: zero
    },
    update: update = {
      opacity: {value: 1}
    },
    exit: {
      opacity: zero
    }
  };
  addEncode(encode, 'stroke',        lookup('domainColor', spec, config));
  addEncode(encode, 'strokeWidth',   lookup('domainWidth', spec, config));
  addEncode(encode, 'strokeOpacity', lookup('domainOpacity', spec, config));

  if (orient === Top || orient === Bottom) {
    u = 'x';
    v = 'y';
  } else {
    u = 'y';
    v = 'x';
  }
  u2 = u + '2';

  enter[v] = zero;
  update[u] = enter[u] = position(spec, 0);
  update[u2] = enter[u2] = position(spec, 1);

  return guideMark(RuleMark, AxisDomainRole, null, null, dataRef, encode, userEncode);
}

function position(spec, pos) {
  return {scale: spec.scale, range: pos};
}
