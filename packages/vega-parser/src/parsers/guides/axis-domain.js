import {Top, Bottom, zero, one} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {RuleMark} from '../marks/marktypes';
import {AxisDomainRole} from '../marks/roles';
import {addEncoders} from '../encode/encode-util';

export default function (spec, config, userEncode, dataRef) {
  const _ = lookup(spec, config);
  const orient = spec.orient;
  let enter;
  let update;
  let u;
  let v;

  const encode = {
    enter: (enter = {opacity: zero}),
    update: (update = {opacity: one}),
    exit: {opacity: zero}
  };

  addEncoders(encode, {
    stroke: _('domainColor'),
    strokeDash: _('domainDash'),
    strokeDashOffset: _('domainDashOffset'),
    strokeWidth: _('domainWidth'),
    strokeOpacity: _('domainOpacity')
  });

  if (orient === Top || orient === Bottom) {
    u = 'x';
    v = 'y';
  } else {
    u = 'y';
    v = 'x';
  }
  const u2 = u + '2';

  enter[v] = zero;
  update[u] = enter[u] = position(spec, 0);
  update[u2] = enter[u2] = position(spec, 1);

  return guideMark(RuleMark, AxisDomainRole, null, null, dataRef, encode, userEncode);
}

function position(spec, pos) {
  return {scale: spec.scale, range: pos};
}
