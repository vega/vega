import {
  curveBasis,
  curveBundle,
  curveCardinal,
  curveCatmullRom,
  curveLinear,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore
} from 'd3-shape';

var lookup = {
  basis: { curve: curveBasis },
  bundle: {
    curve: curveBundle,
    tension: 'beta',
    value: 0.85
  },
  cardinal: {
    curve: curveCardinal,
    tension: 'tension',
    value: 0
  },
  catmullRom: {
    curve: curveCatmullRom,
    tension: 'alpha',
    value: 0.5
  },
  linear: { curve: curveLinear },
  monotone: {
    horizontal: curveMonotoneY,
    vertical:   curveMonotoneX
  },
  natural: { curve: curveNatural },
  step: { curve: curveStep },
  stepAfter: { curve: curveStepAfter },
  stepBefore: { curve: curveStepBefore }
};

export default function curves(type, orientation, tension) {
  var entry = lookup.hasOwnProperty(type) && lookup[type],
      curve = null;

  if (entry) {
    curve = entry.curve || entry[orientation || 'vertical'];
    if (entry.tension && tension != null) {
      curve = curve[entry.tension](tension);
    }
  }

  return curve;
}
