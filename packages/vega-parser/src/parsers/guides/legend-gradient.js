import guideMark from './guide-mark';
import {gradientLength, gradientThickness, isVertical, lookup} from './guide-util';
import {RectMark} from '../marks/marktypes';
import {LegendGradientRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';

export default function(spec, scale, config, userEncode) {
  var zero = {value: 0},
      vertical = isVertical(spec, config.gradientDirection),
      thickness = gradientThickness(spec, config),
      length = gradientLength(spec, config),
      encode = {}, enter, update, start, stop, width, height;

  if (vertical) {
    start = [0, 1];
    stop = [0, 0];
    width = thickness;
    height = length;
  } else {
    start = [0, 0];
    stop = [1, 0];
    width = length;
    height = thickness;
  }

  encode.enter = enter = {
    opacity: zero,
    x: zero,
    y: zero
  };
  addEncode(enter, 'stroke',      lookup('gradientStrokeColor', spec, config));
  addEncode(enter, 'strokeWidth', lookup('gradientStrokeWidth', spec, config));

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    x: zero,
    y: zero,
    fill: {gradient: scale, start: start, stop: stop},
    opacity: {value: 1}
  };

  enter.width = update.width = encoder(width);
  enter.height = update.height = encoder(height);

  return guideMark(RectMark, LegendGradientRole, null, undefined, undefined, encode, userEncode);
}
