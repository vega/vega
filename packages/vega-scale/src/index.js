import {scaleLinear, scaleSequential} from 'd3-scale';

export default function index(scheme) {
  var domain = [],
      length = 0,
      lookup = {},
      interp = scheme ? scaleSequential(scheme) : scaleLinear();

  function scale(_) {
    if (lookup.hasOwnProperty(_)) return interp(lookup[_]);
  }

  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = _.slice();
    length = domain.length;
    lookup = {};
    for (var i=0; i<length;) lookup[domain[i]] = i++;
    interp.domain([0, length - 1]);
    return scale;
  };

  if (!scheme) {
    // sequential scales do not export an invert method

    scale.invert = function(_) {
      return domain[interp.invert(_)];
    };

    scale.invertRange = function(r0, r1) {
      if (arguments.length < 2) {
        return (t = scale.invert(r0)) !== undefined ? [t] : [];
      }

      var lo = interp.invert(r0),
          hi = interp.invert(r1),
          t;

      if (lo > hi) t = lo, lo = hi, hi = t;

      return (hi < 0 || lo >= length) ? [] : domain.slice(
        Math.max(0, Math.ceil(lo)),
        Math.min(length, Math.floor(hi) + 1)
      );
    };
  }

  (scheme
    ? ['interpolator']
    : ['interpolate', 'range', 'rangeRound'])
    .forEach(function(method) {
      scale[method] = function() {
        var r = interp[method].apply(null, arguments);
        return arguments.length ? scale : r;
      };
    });

  scale.copy = function() {
    return (scheme
      ? index(scheme).interpolator(interp.interpolator())
      : index().interpolate(interp.interpolate()).range(interp.range())
    ).domain(domain);
  };

  return scale;
}
