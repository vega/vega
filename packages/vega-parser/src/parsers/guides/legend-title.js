import {GuideTitleStyle} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {TextMark} from '../marks/marktypes';
import {LegendTitleRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter;

  encode.enter = enter = {
    x: {field: {group: 'padding'}},
    y: {field: {group: 'padding'}},
    opacity: zero
  };
  addEncode(enter, 'align',      lookup('titleAlign', spec, config));
  addEncode(enter, 'baseline',   lookup('titleBaseline', spec, config));
  addEncode(enter, 'fill',       lookup('titleColor', spec, config));
  addEncode(enter, 'font',       lookup('titleFont', spec, config));
  addEncode(enter, 'fontSize',   lookup('titleFontSize', spec, config));
  addEncode(enter, 'fontWeight', lookup('titleFontWeight', spec, config));
  addEncode(enter, 'limit',      lookup('titleLimit', spec, config));

  encode.exit = {
    opacity: zero
  };

  encode.update = {
    opacity: {value: 1},
    text: encoder(spec.title)
  };

  return guideMark(TextMark, LegendTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
}
