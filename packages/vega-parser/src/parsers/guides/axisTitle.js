import {Top, Bottom, Left} from './constants';
import {extend} from 'vega-util';

export default function(spec, config, encode, dataRef) {
  encode = encode || {};
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      enter, exit, update, titlePos;

  enter = {
    opacity: {value: 1},
    fill: {value: config.axisTitleColor},
    font: {value: config.axisTitleFont},
    fontSize: {value: config.axisTitleFontSize},
    fontWeight: {value: config.axisTitleFontWeight},
    align: {value: 'center'}
  };

  exit = {
    opacity: {value: 0}
  };

  update = {
    text: {field: 'title'}
  };

  titlePos = {scale: spec.scale, range: 0.5};

  if (orient === Top || orient === Bottom) {
    update.x = titlePos;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top ? 'bottom' : 'top'};
  } else {
    update.y = titlePos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }

  return {
    type: 'text',
    from: dataRef,
    interactive: true,
    encode: {
      exit:   extend(exit, encode.exit),
      enter:  extend(enter, encode.enter),
      update: extend(update, encode.update)
    }
  };
}
