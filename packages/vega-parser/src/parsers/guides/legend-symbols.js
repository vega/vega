import {Index, Offset, Size, Total, Value, LegendScales} from './constants';
import guideMark from './guide-mark';
import {SymbolMark} from '../marks/marktypes';
import {LegendSymbolRole} from '../marks/roles';
import {addEncode} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'shape', config.symbolType);
  addEncode(enter, 'size', config.symbolSize);
  addEncode(enter, 'strokeWidth', config.symbolStrokeWidth);
  if (!spec.fill) {
    addEncode(enter, 'fill', config.symbolFillColor);
    addEncode(enter, 'stroke', config.symbolStrokeColor);
  }

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field: Offset,
    mult:  0.5
  };

  enter.y = update.y = {
    field: Size,
    mult:  0.5,
    offset: {
      field: Total,
      offset: {
        field: {group: 'entryPadding'},
        mult: {field: Index}
      }
    }
  };

  LegendScales.forEach(function(scale) {
    if (spec[scale]) {
      update[scale] = enter[scale] = {scale: spec[scale], field: Value};
    }
  });

  return guideMark(SymbolMark, LegendSymbolRole, null, Value, dataRef, encode, userEncode);
}
