import {GuideTitleStyle} from './constants';
import guideMark from './guide-mark';
import {lookup} from './guide-util';
import {TextMark} from '../marks/marktypes';
import {LegendTitleRole} from '../marks/roles';
import {addEncode, encoder} from '../encode/encode-util';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode, enter;

  encode = {
    enter: enter = {
      opacity: zero,
      x: {field: {group: 'padding'}},
      y: {field: {group: 'padding'}}
    },
    update: {
      opacity: {value: 1},
      text: encoder(spec.title),
      x: enter.x,
      y: enter.y
    },
    exit: {
      opacity: zero
    }
  };
  addEncode(encode, 'align',       lookup('titleAlign', spec, config));
  addEncode(encode, 'baseline',    lookup('titleBaseline', spec, config));
  addEncode(encode, 'fill',        lookup('titleColor', spec, config));
  addEncode(encode, 'font',        lookup('titleFont', spec, config));
  addEncode(encode, 'fontSize',    lookup('titleFontSize', spec, config));
  addEncode(encode, 'fontWeight',  lookup('titleFontWeight', spec, config));
  addEncode(encode, 'limit',       lookup('titleLimit', spec, config));
  addEncode(encode, 'fillOpacity', lookup('titleOpacity', spec, config));

  return guideMark(TextMark, LegendTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
}
