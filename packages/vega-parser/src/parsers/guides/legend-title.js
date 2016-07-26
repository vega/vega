import guideMark from './guide-mark';

export default function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {};

  encode.enter = {
    x: {field: {group: 'padding'}},
    y: {field: {group: 'padding'}},
    opacity: zero,
    fill: {value: config.legendTitleColor},
    font: {value: config.legendTitleFont},
    fontSize: {value: config.legendTitleFontSize},
    fontWeight: {value: config.legendTitleFontWeight},
    align: {value: config.legendTitleAlign},
    baseline: {value: config.legendTitleBaseline}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = {
    opacity: {value: 1},
    text: {field: 'title'}
  };

  return guideMark('text', 'legend-title', null, dataRef, encode, userEncode);
}
