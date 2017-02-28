import {Top, Bottom, Left, Right, Label, Value} from './constants';
import guideMark from './guide-mark';
import {TextMark} from '../marks/marktypes';
import {AxisLabelRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      pad = spec.labelPadding != null ? spec.labelPadding : config.labelPadding,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;

  encode.enter = enter = {
    opacity: zero,
    text: {field: Label}
  };
  addEncode(enter, 'angle', config.labelAngle);
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'limit', config.labelLimit);

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  tickSize = encoder(size);
  tickSize.mult = sign;
  tickSize.offset = encoder(pad);
  tickSize.offset.mult = sign;

  tickPos = {
    scale: spec.scale,
    field: Value,
    band: 0.5
  };

  if (orient === Top || orient === Bottom) {
    update.y = enter.y = tickSize;
    update.x = enter.x = exit.x = tickPos;
    addEncode(update, 'align', 'center');
    addEncode(update, 'baseline', orient === Top ? 'bottom' : 'top');
  } else {
    update.x = enter.x = tickSize;
    update.y = enter.y = exit.y = tickPos;
    addEncode(update, 'align', orient === Right ? 'left' : 'right');
    addEncode(update, 'baseline', 'middle');
  }

  return guideMark(TextMark, AxisLabelRole, Value, dataRef, encode, userEncode);
}
