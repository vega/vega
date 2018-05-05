import {Value, Perc, Perc2} from './constants';
import guideMark from './guide-mark';
import {gradientLength, gradientThickness, isVertical, lookup} from './guide-util';
import {RectMark} from '../marks/marktypes';
import {LegendBandRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';

export default function(spec, scale, config, userEncode, dataRef) {
  var zero = {value: 0},
      vertical = isVertical(spec, config.gradientDirection),
      thickness = gradientThickness(spec, config),
      length = gradientLength(spec, config),
      encode = {}, enter, update, u, v, uu, vv, adjust = '';

  vertical
    ? (u = 'y', uu = 'y2', v = 'x', vv = 'width', adjust = '1-')
    : (u = 'x', uu = 'x2', v = 'y', vv = 'height');

  encode.enter = enter = {opacity: zero};
  addEncode(enter, 'stroke',      lookup('gradientStrokeColor', spec, config));
  addEncode(enter, 'strokeWidth', lookup('gradientStrokeWidth', spec, config));

  encode.exit = {opacity: zero};
  encode.update = update = {opacity: {value: 1}};

  enter.fill = update.fill = {scale: scale, field: Value};

  enter[u] = update[u] = {signal: adjust + 'datum.' + Perc, mult: length};
  enter[v] = update[v] = {value: 0};

  enter[uu] = update[uu] = {signal: adjust + 'datum.' + Perc2, mult: length};
  enter[vv] = update[vv] = encoder(thickness);

  return guideMark(RectMark, LegendBandRole, null, Value, dataRef, encode, userEncode);
}
