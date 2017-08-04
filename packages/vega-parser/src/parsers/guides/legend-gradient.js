import guideMark from './guide-mark';
import {RectMark} from '../marks/marktypes';
import {LegendGradientRole} from '../marks/roles';
import {addEncode} from '../encode/encode-util';

export default function(spec, scale, config, userEncode) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    x: zero,
    y: zero
  };
  addEncode(enter, 'width', config.gradientWidth);
  addEncode(enter, 'height', config.gradientHeight);
  addEncode(enter, 'stroke', config.gradientStrokeColor);
  addEncode(enter, 'strokeWidth', config.gradientStrokeWidth);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    x: zero,
    y: zero,
    fill: {gradient: scale},
    opacity: {value: 1}
  };
  addEncode(update, 'width', config.gradientWidth);
  addEncode(update, 'height', config.gradientHeight);

  return guideMark(RectMark, LegendGradientRole, null, undefined, undefined, encode, userEncode);
}
