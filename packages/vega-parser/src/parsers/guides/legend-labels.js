import {Index, Label, Offset, Size, Total, Value} from './constants';
import guideMark from './guide-mark';
import {TextMark} from '../marks/marktypes';
import {LegendLabelRole} from '../marks/roles';
import {addEncode} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    text: {field: Label}
  };
  addEncode(enter, 'align', config.labelAlign);
  addEncode(enter, 'baseline', config.labelBaseline);
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'limit', config.labelLimit);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field:  Offset,
    offset: config.labelOffset
  };

  enter.y = update.y = {
    field:  Size,
    mult:   0.5,
    offset: {
      field: Total,
      offset: {
        field: {group: 'entryPadding'},
        mult: {field: Index}
      }
    }
  };

  return guideMark(TextMark, LegendLabelRole, Value, dataRef, encode, userEncode);
}
