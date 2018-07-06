import guideMark from './guide-mark';
import {gradientLength, gradientThickness, isVertical, lookup} from './guide-util';
import {RectMark} from '../marks/marktypes';
import {LegendGradientRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';
import {extend} from 'vega-util';

export default function(spec, scale, config, userEncode) {
  var zero = {value: 0},
      vertical = isVertical(spec, config.gradientDirection),
      thickness = gradientThickness(spec, config),
      length = gradientLength(spec, config),
      encode, enter, start, stop, width, height;

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

  encode = {
    enter: enter = {
      opacity: zero,
      x: zero,
      y: zero,
      width: encoder(width),
      height: encoder(height)
    },
    update: extend({}, enter, {
      opacity: {value: 1},
      fill: {gradient: scale, start: start, stop: stop}
    }),
    exit: {
      opacity: zero
    }
  };
  addEncode(encode, 'stroke',      lookup('gradientStrokeColor', spec, config));
  addEncode(encode, 'strokeWidth', lookup('gradientStrokeWidth', spec, config));
  addEncode(encode, 'opacity',     lookup('gradientOpacity', spec, config), 'update');

  return guideMark(RectMark, LegendGradientRole, null, undefined, undefined, encode, userEncode);
}
