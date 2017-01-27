import guideMark from './guide-mark';
import {TextMark} from '../marks/marktypes';
import {LegendTitleRole} from '../marks/roles';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      title = spec.title,
      encode = {};

  encode.enter = {
    x: {field: {group: 'padding'}},
    y: {field: {group: 'padding'}},
    opacity: zero,
    fill: {value: config.titleColor},
    font: {value: config.titleFont},
    fontSize: {value: config.titleFontSize},
    fontWeight: {value: config.titleFontWeight},
    align: {value: config.titleAlign},
    baseline: {value: config.titleBaseline}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = {
    opacity: {value: 1},
    text: title && title.signal ? {signal: title.signal} : {value: title + ''}
  };

  return guideMark(TextMark, LegendTitleRole, null, dataRef, encode, userEncode);
}
