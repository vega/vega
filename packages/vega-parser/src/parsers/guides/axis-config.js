import {Top, Bottom} from './constants';
import {extend} from 'vega-util';

export default function(spec, scope) {
  var config = scope.config,
      orient = spec.orient,
      xy = (orient === Top || orient === Bottom) ? config.axisX : config.axisY,
      band = scope.scaleType(spec.scale) === 'band' && config.axisBand;

  return (xy || band) ? extend({}, config.axis, xy, band) : config.axis;
}