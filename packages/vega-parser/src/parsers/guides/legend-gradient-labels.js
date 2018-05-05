import {Index, Label, Perc, Value, GuideLabelStyle} from './constants';
import guideMark from './guide-mark';
import {gradientLength, gradientThickness, isVertical, lookup} from './guide-util';
import {TextMark} from '../marks/marktypes';
import {LegendLabelRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';
import {value} from '../../util';

var alignExpr = 'datum.' + Perc + '<=0?"left"'
  + ':datum.' + Perc + '>=1?"right":"center"';

var baselineExpr = 'datum.' + Perc + '<=0?"bottom"'
  + ':datum.' + Perc + '>=1?"top":"middle"';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      vertical = isVertical(spec, config.gradientDirection),
      thickness = encoder(gradientThickness(spec, config)),
      length = gradientLength(spec, config),
      overlap = lookup('labelOverlap', spec, config),
      encode = {}, enter, update, u, v, adjust = '';

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'fill',       lookup('labelColor', spec, config));
  addEncode(enter, 'font',       lookup('labelFont', spec, config));
  addEncode(enter, 'fontSize',   lookup('labelFontSize', spec, config));
  addEncode(enter, 'fontWeight', lookup('labelFontWeight', spec, config));
  addEncode(enter, 'limit',      value(spec.labelLimit, config.gradientLabelLimit));

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1},
    text: {field: Label}
  };

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
  if (overlap) spec.overlap = {method: overlap, order:  'datum.' + Index};
  return spec;
}
