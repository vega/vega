import {getScale} from './scale';
import {Gradient} from 'vega-scenegraph';
import {scaleFraction, scaleCopy} from 'vega-scale';
import {peek} from 'vega-util';

export default function(scale, p0, p1, count, group) {
  scale = getScale(scale, (group || this).context);

  var gradient = Gradient(p0, p1),
      stops = scale.domain(),
      min = stops[0],
      max = peek(stops);

  if (max === min) {
    // expand scale if domain has zero span, fix #1479
    var offset = (min / 2) || 1;
    stops[0] = (min -= offset);
    stops[stops.length - 1] = (max += offset);
    scale = scaleCopy(scale).domain(stops);
  }

  if (scale.ticks) {
    stops = scale.ticks(+count || 15);
    if (min !== stops[0]) stops.unshift(min);
    if (max !== peek(stops)) stops.push(max);
  }

  var fraction = scaleFraction(scale, min, max);
  stops.forEach(_ => gradient.stop(fraction(_), scale(_)));

  return gradient;
}
