import parseSignalUpdates from './signal-updates';
import {initScale, parseScale} from './scale';
import parseProjection from './projection';
import parseLegend from './legend';
import parseSignal from './signal';
import parseTitle from './title';
import parseData from './data';
import parseMark from './mark';
import parseAxis from './axis';
import {array} from 'vega-util';

export default function(spec, scope, preprocessed) {
  var signals = array(spec.signals),
      scales = array(spec.scales);

  if (!preprocessed) signals.forEach(function(_) {
    parseSignal(_, scope);
  });

  array(spec.projections).forEach(function(_) {
    parseProjection(_, scope);
  });

  scales.forEach(function(_) {
    initScale(_, scope);
  });

  array(spec.data).forEach(function(_) {
    parseData(_, scope);
  });

  scales.forEach(function(_) {
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

  if (spec.title) {
    parseTitle(spec.title, scope);
  }

  scope.parseLambdas();
  return scope;
}
