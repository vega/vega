import Gradient from '../Gradient';

export default function(scale, p0, p1, count) {
  var gradient = Gradient(p0, p1),
      stops = scale.domain(),
      min = stops[0],
      max = stops[stops.length-1],
      i, n, fraction;

  if (scale.type !== 'linear' && scale.ticks) {
    stops = scale.ticks(+count || 15);
    if (min !== stops[0]) stops.unshift(min);
    if (max !== stops[stops.length-1]) stops.push(max);
  }

  fraction = scale.range
    ? scale.copy().domain([min, max]).range([0, 1])
    : function(_) { return (_ - min) / (max - min); };

  for (i=0, n=stops.length; i<n; ++i) {
    gradient.stop(fraction(stops[i]), scale(stops[i]));
  }

  return gradient;
}
