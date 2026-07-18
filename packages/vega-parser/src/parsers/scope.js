import parseSignalUpdates from './signal-updates.js';
import {initScale, parseScale} from './scale.js';
import parseProjection from './projection.js';
import parseLegend from './legend.js';
import parseSignal from './signal.js';
import parseTitle from './title.js';
import parseData from './data.js';
import parseMark from './mark.js';
import parseAxis from './axis.js';
import {array} from 'vega-util';

export default function(spec, scope, preprocessed) {
  const signals = array(spec.signals),
        scales = array(spec.scales);

  // parse signal definitions, if not already preprocessed
  if (!preprocessed) signals.forEach(_ => parseSignal(_, scope));

  // parse cartographic projection definitions
  array(spec.projections).forEach(_ => parseProjection(_, scope));

  // initialize scale references
  scales.forEach(_ => initScale(_, scope));

  // parse data sources
  array(spec.data).forEach(_ => parseData(_, scope));

  // parse scale definitions
  scales.forEach(_ => parseScale(_, scope));

  // parse signal updates
  (preprocessed || signals).forEach(_ => parseSignalUpdates(_, scope));

  // parse axis definitions
  array(spec.axes).forEach(_ => parseAxis(_, scope));

  // parse mark definitions
  array(spec.marks).forEach(_ => parseMark(_, scope));

  // parse legend definitions
  array(spec.legends).forEach(_ => parseLegend(_, scope));

  // parse title, if defined
  if (spec.title) parseTitle(spec.title, scope);

  // parse collected lambda (anonymous) expressions
  scope.parseLambdas();

  return scope;
}
