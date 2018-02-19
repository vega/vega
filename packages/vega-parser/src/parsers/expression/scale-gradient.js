import {getScale} from './scale';
import {Gradient} from 'vega-scenegraph';
import {scaleFraction} from 'vega-scale';

export default function(scale, p0, p1, count, group) {
  scale = getScale(scale, (group || this).context);

  var gradient = Gradient(p0, p1),
      stops = scale.domain(),
      min = stops[0],
      max = stops[stops.length-1],
      fraction = scaleFraction(scale, min, max);

  if (scale.ticks) {
    stops = scale.ticks(+count || 15);
    if (min !== stops[0]) stops.unshift(min);
    if (max !== stops[stops.length-1]) stops.push(max);
  }

  for (var i=0, n=stops.length; i<n; ++i) {
    gradient.stop(fraction(stops[i]), scale(stops[i]));
  }

  return gradient;
}
