import {Perc, Label} from './constants';
import guideMark from './guide-mark';
import {TextMark} from '../marks/marktypes';
import {LegendLabelRole} from '../marks/roles';

var alignExpr = 'datum.' + Perc + '<=0?"left"'
  + ':datum.' + Perc + '>=1?"right":"center"';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    text: {field: Label},
    fill: {value: config.labelColor},
    font: {value: config.labelFont},
    fontSize: {value: config.labelFontSize},
    baseline: {value: config.gradientLabelBaseline}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field: Perc,
    mult: config.gradientWidth
  };

  enter.y = update.y = {
    value: config.gradientHeight,
    offset: config.gradientLabelOffset
  };

  enter.align = update.align = {signal: alignExpr};

  return guideMark(TextMark, LegendLabelRole, Label, dataRef, encode, userEncode);
}
