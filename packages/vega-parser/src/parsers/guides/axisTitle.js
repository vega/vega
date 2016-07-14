import {Top, Bottom, Left} from './constants';

export default function(spec, config, dataRef) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      titlePos = {scale: spec.scale, range: 0.5},
      enter, exit, update;

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
    encode: {enter: enter, exit: exit, update: update}
  };
}
