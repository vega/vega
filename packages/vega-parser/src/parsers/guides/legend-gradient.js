import guideMark from './guide-mark';
import {RectMark} from '../marks/marktypes';
import {LegendGradientRole} from '../marks/roles';

export default function(scale, config, userEncode) {
  var zero = {value: 0},
      encode = {};

  encode.enter = {
    opacity: zero,
    x: zero,
    y: zero,
    width: {value: config.gradientWidth},
    height: {value: config.gradientHeight},
    stroke: {value: config.gradientStrokeColor},
    strokeWidth: {value: config.gradientStrokeWidth}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = {
    x: zero,
    y: zero,
    width: {value: config.gradientWidth},
    height: {value: config.gradientHeight},
    fill: {gradient: scale},
    opacity: {value: 1}
  };

  return guideMark(RectMark, LegendGradientRole, undefined, undefined, encode, userEncode);
}
