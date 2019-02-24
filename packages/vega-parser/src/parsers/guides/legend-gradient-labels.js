import {Index, Label, Perc, Value, GuideLabelStyle} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {TextMark} from '../marks/marktypes';
import {LegendLabelRole} from '../marks/roles';
import {addEncoders, encoder} from '../encode/encode-util';
import {value} from '../../util';

var alignExpr = 'datum.' + Perc + '<=0?"left"'
  + ':datum.' + Perc + '>=1?"right":"center"';

var baselineExpr = 'datum.' + Perc + '<=0?"bottom"'
  + ':datum.' + Perc + '>=1?"top":"middle"';

export default function(spec, config, userEncode, dataRef) {
  var _ = lookup(spec, config),
      zero = {value: 0},
      vertical = _.isVertical(),
      thickness = encoder(_.gradientThickness()),
      length = _.gradientLength(),
      overlap = _('labelOverlap'),
      separation = _('labelSeparation'),
      encode, enter, update, u, v, adjust = '';

  encode = {
    enter: enter = {
      opacity: zero
    },
    update: update = {
      opacity: {value: 1},
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

  spec = guideMark(TextMark, LegendLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);
  if (overlap) {
    spec.overlap = {
      separation: separation,
      method: overlap,
      order: 'datum.' + Index
    };
  }
  return spec;
}
