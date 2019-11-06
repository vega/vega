import {Top, Left, Bottom, Value, zero, one} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {RuleMark} from '../marks/marktypes';
import {AxisTickRole} from '../marks/roles';
import {addEncoders, encoder} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef, size, band) {
  var _ = lookup(spec, config),
      orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      encode, enter, exit, update, tickSize, tickPos;

  encode = {
    enter: enter = {opacity: zero},
    update: update = {opacity: one},
    exit: exit = {opacity: zero}
  };

  addEncoders(encode, {
    stroke:           _('tickColor'),
    strokeDash:       _('tickDash'),
    strokeDashOffset: _('tickDashOffset'),
    strokeOpacity:    _('tickOpacity'),
    strokeWidth:      _('tickWidth')
  });

  tickSize = encoder(size);
  tickSize.mult = sign;

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   band.band,
    extra:  band.extra,
    offset: band.offset,
    round:  _('tickRound')
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
