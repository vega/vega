import {Index, Label, Size, Total} from './constants';
import guideMark from './guide-mark';
import {TextMark} from '../marks/marktypes';
import {LegendLabelRole} from '../marks/roles';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    fill: {value: config.labelColor},
    text: {field: Label},
    font: {value: config.labelFont},
    fontSize: {value: config.labelFontSize},
    align: {value: config.labelAlign},
    baseline: {value: config.labelBaseline}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field:  Size,
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

  return guideMark(TextMark, LegendLabelRole, Label, dataRef, encode, userEncode);
}
