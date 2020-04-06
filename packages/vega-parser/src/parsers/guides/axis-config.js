import {Top, Bottom} from './constants';
import {extend} from 'vega-util';

export default function (spec, scope) {
  const config = scope.config;
  const orient = spec.orient;
  const xy = orient === Top || orient === Bottom ? config.axisX : config.axisY;
  const or = config['axis' + orient[0].toUpperCase() + orient.slice(1)];
  const band = scope.scaleType(spec.scale) === 'band' && config.axisBand;

  return xy || or || band ? extend({}, config.axis, xy, or, band) : config.axis;
}
