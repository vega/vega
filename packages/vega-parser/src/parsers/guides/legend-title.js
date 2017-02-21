import guideMark from './guide-mark';
import {TextMark} from '../marks/marktypes';
import {LegendTitleRole} from '../marks/roles';
import {addEncode} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      title = spec.title,
      encode = {}, enter;

  encode.enter = enter = {
    x: {field: {group: 'padding'}},
    y: {field: {group: 'padding'}},
    opacity: zero
  };
  addEncode(enter, 'align', config.titleAlign);
  addEncode(enter, 'baseline', config.titleBaseline);
  addEncode(enter, 'fill', config.titleColor);
  addEncode(enter, 'font', config.titleFont);
  addEncode(enter, 'fontSize', config.titleFontSize);
  addEncode(enter, 'fontWeight', config.titleFontWeight);
  addEncode(enter, 'limit', config.titleLimit);

  encode.exit = {
    opacity: zero
  };

  encode.update = {
    opacity: {value: 1},
    text: title && title.signal ? {signal: title.signal} : {value: title + ''}
  };

  return guideMark(TextMark, LegendTitleRole, null, dataRef, encode, userEncode);
}
