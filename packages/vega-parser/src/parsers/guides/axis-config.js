import {Top, Bottom} from './constants';
import {extend} from 'vega-util';

export default function(spec, scope) {
  var config = scope.config,
      orient = spec.orient,
      xy = (orient === Top || orient === Bottom) ? config.axisX : config.axisY,
      or = config['axis' + orient[0].toUpperCase() + orient.slice(1)],
      band = scope.scaleType(spec.scale) === 'band' && config.axisBand;

  return (xy || or || band)
    ? extend({}, config.axis, xy, or, band)
    : config.axis;
}