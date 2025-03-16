import {ifX, ifY} from './axis-util.js';
import {one, zero} from './constants.js';
import guideMark from './guide-mark.js';
import {lookup} from './guide-util.js';
import {addEncoders} from '../encode/util.js';
import {RuleMark} from '../marks/marktypes.js';
import {AxisDomainRole} from '../marks/roles.js';

export default function(spec, config, userEncode, dataRef) {
  const _ = lookup(spec, config),
        orient = spec.orient;

  let enter, update;
  const encode = {
    enter: enter = {opacity: zero},
    update: update = {opacity: one},
    exit: {opacity: zero}
  };

  addEncoders(encode, {
    stroke:           _('domainColor'),
    strokeCap:        _('domainCap'),
    strokeDash:       _('domainDash'),
    strokeDashOffset: _('domainDashOffset'),
    strokeWidth:      _('domainWidth'),
    strokeOpacity:    _('domainOpacity')
  });

  const pos0 = position(spec, 0);
  const pos1 = position(spec, 1);

  enter.x = update.x = ifX(orient, pos0, zero);
  enter.x2 = update.x2 = ifX(orient, pos1);

  enter.y = update.y = ifY(orient, pos0, zero);
  enter.y2 = update.y2 = ifY(orient, pos1);

  return guideMark({
    type: RuleMark,
    role: AxisDomainRole,
    from: dataRef,
    encode
  }, userEncode);
}

function position(spec, pos) {
  return {scale: spec.scale, range: pos};
}
