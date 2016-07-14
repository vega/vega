import {Top, Bottom, Left, Right, Value, Label} from './constants';

export default function(spec, config, dataRef) {
  var orient = spec.orient,
      size = +spec.tickSize|| config.axisTickSize,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      pad = +spec.tickPadding || config.axisTickPadding,
      zero = {value: 0},
      tickSize = {value: sign * (Math.max(size, 0) + pad)},
      tickPos = {scale: spec.scale, field: Value, band: 0.5},
      enter, exit, update;

  enter = {
    opacity: zero,
    fill: {value: config.axisTickLabelColor},
    font: {value: config.axisTickLabelFont},
    fontSize: {value: config.axisTickLabelFontSize},
    text: {field: Label}
  };

  exit = {
    opacity: zero
  };

  update = {
    opacity: {value: 1}
  };

  if (orient === Top || orient === Bottom) {
    update.y = enter.y = tickSize;
    update.x = enter.x = exit.x = tickPos;
    update.align = {value: 'center'};
    update.baseline = {value: orient === Top ? 'bottom' : 'top'};
  } else {
    update.x = enter.x = tickSize;
    update.y = enter.y = exit.y = tickPos;
    update.align = {value: orient === Right ? 'left' : 'right'};
    update.baseline = {value: 'middle'};
  }

  return {
    type: 'text',
    key:  Value,
    from: dataRef,
    interactive: true,
    encode: {enter: enter, exit: exit, update: update}
  };
}
