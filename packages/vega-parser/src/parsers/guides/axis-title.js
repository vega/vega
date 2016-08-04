import {Top, Bottom, Left} from './constants';
import guideMark from './guide-mark';
import {Text} from '../marks/marktypes';
import {AxisTitleRole} from '../marks/roles';

export default function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      encode = {}, update, titlePos;

  encode.enter = {
    opacity: {value: 0},
    fill: {value: config.axisTitleColor},
    font: {value: config.axisTitleFont},
    fontSize: {value: config.axisTitleFontSize},
    fontWeight: {value: config.axisTitleFontWeight},
    align: {value: 'center'}
  };

  encode.exit = {
    opacity: {value: 0}
  };

  encode.update = update = {
    opacity: {value: 1},
    text: {field: 'title'}
  };

  titlePos = {
    scale: spec.scale,
    range: 0.5
  };

  if (orient === Top || orient === Bottom) {
    update.x = titlePos;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top ? 'bottom' : 'top'};
  } else {
    update.y = titlePos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }

  return guideMark(Text, AxisTitleRole, null, dataRef, encode, userEncode);
}
