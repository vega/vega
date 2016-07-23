import {Top, Bottom, Left, Right, Value, Label} from './constants';
import encoder from './encoder';
import {extend} from 'vega-util';

export default function(spec, config, encode, dataRef) {
  encode = encode || {};
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      size = spec.tickSize != null ? spec.tickSize : config.axisTickSize,
      pad = spec.tickPadding != null ? spec.tickPadding : config.axisTickPadding,
      zero = {value: 0},
      enter, exit, update, tickSize, tickPos;

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

  tickSize = extend(encoder(size), {
    mult:   sign,
    offset: extend(encoder(pad), {mult: sign})
  });

  tickPos = {scale: spec.scale, field: Value, band: 0.5};

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
    key:  Label,
    from: dataRef,
    interactive: true,
    encode: {
      exit:   extend(exit, encode.exit),
      enter:  extend(enter, encode.enter),
      update: extend(update, encode.update)
    }
  };
}
