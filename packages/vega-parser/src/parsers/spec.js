import parseSignalUpdates from './signal-updates';
import parseProjection from './projection';
import parseLegend from './legend';
import parseSignal from './signal';
import parseScale from './scale';
import parseData from './data';
import parseMark from './mark';
import parseAxis from './axis';
import {array, toSet} from 'vega-util';

var predefined = toSet(['width', 'height', 'padding']);

export default function(spec, scope) {
  var signals = array(spec.signals);

  signals.forEach(function(_) {
    if (!predefined[_.name]) parseSignal(_, scope);
  });

  array(spec.projections).forEach(function(_) {
    parseProjection(_, scope);
  });

  array(spec.data).forEach(function(_) {
    parseData(_, scope);
  });

  array(spec.scales).forEach(function(_) {
    parseScale(_, scope);
  });

  signals.forEach(function(_) {
    parseSignalUpdates(_, scope);
  });

  array(spec.axes).forEach(function(_) {
    parseAxis(_, scope);
  });

  array(spec.marks).forEach(function(_) {
    parseMark(_, scope);
  });

  array(spec.legends).forEach(function(_) {
    parseLegend(_, scope);
  });

  return scope;
}
