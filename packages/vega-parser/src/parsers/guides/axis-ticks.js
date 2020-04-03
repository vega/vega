import {Bottom, Left, Top, Value, one, zero} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {RuleMark} from '../marks/marktypes';
import {AxisTickRole} from '../marks/roles';
import {addEncoders, encoder} from '../encode/encode-util';
import { isSignal } from '../../util';
import { resolveAxisOrientConditional, xyAxisConditionalEncoding } from './axis-util';

export default function(spec, config, userEncode, dataRef, size, band) {
  var _ = lookup(spec, config),
      orient = spec.orient,
      sign = resolveAxisOrientConditional([Left, Top], orient, -1, 1),
      encode, enter, exit, update, tickSize, tickPos, u, v, v2;

  encode = {
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

  if (isSignal(orient)) {
    for (u of ['x', 'y']) {
      v = u === 'x' ? 'y' : 'x';
      v2 = v + '2';

      update[v] = enter[v] = xyAxisConditionalEncoding(u, orient.signal, zero, tickPos);
      update[v2] = enter[v2] = xyAxisConditionalEncoding(u, orient.signal, tickSize, null);
      exit[u] = xyAxisConditionalEncoding(u, orient.signal, tickPos, null);
    }
  } else {
    if (orient === Top || orient === Bottom) {
      update.y = enter.y = zero;
      update.y2 = enter.y2 = tickSize;
      update.x = enter.x = exit.x = tickPos;
    } else {
      update.x = enter.x = zero;
      update.x2 = enter.x2 = tickSize;
      update.y = enter.y = exit.y = tickPos;
    }
  }

  return guideMark({
    type: RuleMark,
    role: AxisTickRole,
    key:  Value,
    from: dataRef,
    encode
  }, userEncode);
}
