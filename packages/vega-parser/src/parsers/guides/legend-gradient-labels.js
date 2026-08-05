import {
  Bottom, Center, GuideLabelStyle, Index, Label, Left, Middle,
  Perc, Right, Top, Value, one, zero
} from './constants.js';
import guideMark from './guide-mark.js';
import {lookup} from './guide-util.js';
import {addEncoders, encoder} from '../encode/util.js';
import {TextMark} from '../marks/marktypes.js';
import {LegendLabelRole} from '../marks/roles.js';
import {value} from '../../util.js';

const alignExpr = `datum.${Perc}<=0?"${Left}":datum.${Perc}>=1?"${Right}":"${Center}"`,
      baselineExpr = `datum.${Perc}<=0?"${Bottom}":datum.${Perc}>=1?"${Top}":"${Middle}"`;

export default function(spec, config, userEncode, dataRef) {
  const _ = lookup(spec, config),
        vertical = _.isVertical(),
        thickness = encoder(_.gradientThickness()),
        length = _.gradientLength();

  let overlap = _('labelOverlap'),
      enter, update, u, v, adjust = '';

  const encode = {
    enter: enter = {
      opacity: zero
    },
    update: update = {
      opacity: one,
      text: {field: Label}
    },
    exit: {
      opacity: zero
    }
  };

  addEncoders(encode, {
    fill:        _('labelColor'),
    fillOpacity: _('labelOpacity'),
    font:        _('labelFont'),
    fontSize:    _('labelFontSize'),
    fontStyle:   _('labelFontStyle'),
    fontWeight:  _('labelFontWeight'),
    limit:       value(spec.labelLimit, config.gradientLabelLimit)
  });

  if (vertical) {
    enter.align = {value: 'left'};
    enter.baseline = update.baseline = {signal: baselineExpr};
    u = 'y'; v = 'x'; adjust = '1-';
  } else {
    enter.align = update.align = {signal: alignExpr};
    enter.baseline = {value: 'top'};
    u = 'x'; v = 'y';
  }

  enter[u] = update[u] = {signal: adjust + 'datum.' + Perc, mult: length};

  enter[v] = update[v] = thickness;
  thickness.offset = value(spec.labelOffset, config.gradientLabelOffset) || 0;

  overlap = overlap ? {
    separation: _('labelSeparation'),
    method: overlap,
    order: 'datum.' + Index
  } : undefined;

  // type, role, style, key, dataRef, encode, extras
  return guideMark({
    type:  TextMark,
    role:  LegendLabelRole,
    style: GuideLabelStyle,
    key:   Value,
    from: dataRef,
    encode,
    overlap
  }, userEncode);
}
