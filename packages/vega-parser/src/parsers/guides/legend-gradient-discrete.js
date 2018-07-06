import {Value, Perc, Perc2} from './constants';
import guideMark from './guide-mark';
import {gradientLength, gradientThickness, isVertical, lookup} from './guide-util';
import {RectMark} from '../marks/marktypes';
import {LegendBandRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';
import {extend} from 'vega-util';

export default function(spec, scale, config, userEncode, dataRef) {
  var zero = {value: 0},
      vertical = isVertical(spec, config.gradientDirection),
      thickness = gradientThickness(spec, config),
      length = gradientLength(spec, config),
      encode, enter, u, v, uu, vv, adjust = '';

  vertical
    ? (u = 'y', uu = 'y2', v = 'x', vv = 'width', adjust = '1-')
    : (u = 'x', uu = 'x2', v = 'y', vv = 'height');

  enter = {
    opacity: zero,
    fill: {scale: scale, field: Value}
  };
  enter[u]  = {signal: adjust + 'datum.' + Perc, mult: length};
  enter[v]  = zero;
  enter[uu] = {signal: adjust + 'datum.' + Perc2, mult: length};
  enter[vv] = encoder(thickness);

  encode = {
    enter: enter,
    update: extend({}, enter, {opacity: {value: 1}}),
    exit: {opacity: zero}
  };
  addEncode(encode, 'stroke',      lookup('gradientStrokeColor', spec, config));
  addEncode(encode, 'strokeWidth', lookup('gradientStrokeWidth', spec, config));
  addEncode(encode, 'opacity',     lookup('gradientOpacity', spec, config), 'update');

  return guideMark(RectMark, LegendBandRole, null, Value, dataRef, encode, userEncode);
}
