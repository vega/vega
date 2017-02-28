import {Perc, Label} from './constants';
import guideMark from './guide-mark';
import {TextMark} from '../marks/marktypes';
import {LegendLabelRole} from '../marks/roles';
import {addEncode} from '../encode/encode-util';

var alignExpr = 'datum.' + Perc + '<=0?"left"'
  + ':datum.' + Perc + '>=1?"right":"center"';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    text: {field: Label}
  };
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'baseline', config.gradientLabelBaseline);
  addEncode(enter, 'limit', config.gradientLabelLimit);

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

  return guideMark(TextMark, LegendLabelRole, Perc, dataRef, encode, userEncode);
}
