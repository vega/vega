import {Top, Bottom, Left} from './constants';
import guideMark from './guide-mark';
import {has} from '../encode/encode-util';
import {TextMark} from '../marks/marktypes';
import {AxisTitleRole} from '../marks/roles';

export default function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      horizontal = (orient === Top || orient === Bottom),
      encode = {}, update, titlePos;

  encode.enter = {
    opacity: {value: 0},
    fill: {value: config.titleColor},
    font: {value: config.titleFont},
    fontSize: {value: config.titleFontSize},
    fontWeight: {value: config.titleFontWeight},
    align: {value: config.titleAlign}
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

  if (horizontal) {
    update.x = titlePos;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top ? 'bottom' : 'top'};
  } else {
    update.y = titlePos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }

  if (config.titleAngle != null) {
    update.angle = {value: config.titleAngle};
  }

  if (config.titleBaseline != null) {
    update.baseline = {value: config.titleBaseline};
  }

  if (config.titleX != null) {
    update.x = {value: config.titleX};
  } else if (horizontal && !has(userEncode, 'x')) {
    encode.enter.auto = {value: true}
  }

  if (config.titleY != null) {
    update.y = {value: config.titleY};
  } else if (!horizontal && !has(userEncode, 'y')) {
    encode.enter.auto = {value: true}
  }

  return guideMark(TextMark, AxisTitleRole, null, dataRef, encode, userEncode);
}
