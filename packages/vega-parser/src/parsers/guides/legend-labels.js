import {Index, Label, Size, Total} from './constants';
import guideMark from './guide-mark';
import {Text} from '../marks/marktypes';
import {LegendLabelRole} from '../marks/roles';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    fill: {value: config.legendLabelColor},
    text: {field: Label},
    font: {value: config.legendLabelFont},
    fontSize: {value: config.legendLabelFontSize},
    align: {value: config.legendLabelAlign},
    baseline: {value: config.legendLabelBaseline}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field:  Size,
    offset: config.legendLabelOffset
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

  return guideMark(Text, LegendLabelRole, Label, dataRef, encode, userEncode);
}
