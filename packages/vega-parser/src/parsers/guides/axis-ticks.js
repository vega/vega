import {getSign, ifX, ifY} from './axis-util.js';
import {Value, one, zero} from './constants.js';
import guideMark from './guide-mark.js';
import {lookup} from './guide-util.js';
import {addEncoders, encoder} from '../encode/util.js';
import {RuleMark} from '../marks/marktypes.js';
import {AxisTickRole} from '../marks/roles.js';

export default function(spec, config, userEncode, dataRef, size, band) {
  const _ = lookup(spec, config),
        orient = spec.orient,
        sign = getSign(orient, -1, 1);

  let enter, exit, update;
  const encode = {
    enter: enter = {opacity: zero},
    update: update = {opacity: one},
    exit: exit = {opacity: zero}
  };

  addEncoders(encode, {
    stroke:           _('tickColor'),
    strokeCap:        _('tickCap'),
    strokeDash:       _('tickDash'),
    strokeDashOffset: _('tickDashOffset'),
    strokeOpacity:    _('tickOpacity'),
    strokeWidth:      _('tickWidth')
  });

  const tickSize = encoder(size);
  tickSize.mult = sign;

  const tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   band.band,
    extra:  band.extra,
    offset: band.offset,
    round:  _('tickRound')
  };

  update.y = enter.y = ifX(orient, zero, tickPos);
  update.y2 = enter.y2 = ifX(orient, tickSize);
  exit.x = ifX(orient, tickPos);

  update.x = enter.x = ifY(orient, zero, tickPos);
  update.x2 = enter.x2 = ifY(orient, tickSize);
  exit.y = ifY(orient, tickPos);

  return guideMark({
    type: RuleMark,
    role: AxisTickRole,
    key:  Value,
    from: dataRef,
    encode
  }, userEncode);
}
