export default function(context, gradient, bounds) {
  const w = bounds.width(),
        h = bounds.height(),
        stop = gradient.stops,
        n = stop.length;

  const canvasGradient = gradient.gradient === 'radial'
    ? context.createRadialGradient(
        bounds.x1 + v(gradient.x1, 0.5) * w,
        bounds.y1 + v(gradient.y1, 0.5) * h,
        Math.max(w, h) * v(gradient.r1, 0),
        bounds.x1 + v(gradient.x2, 0.5) * w,
        bounds.y1 + v(gradient.y2, 0.5) * h,
        Math.max(w, h) * v(gradient.r2, 0.5)
      )
    : context.createLinearGradient(
        bounds.x1 + v(gradient.x1, 0) * w,
        bounds.y1 + v(gradient.y1, 0) * h,
        bounds.x1 + v(gradient.x2, 1) * w,
        bounds.y1 + v(gradient.y2, 0) * h
      );

  for (let i=0; i<n; ++i) {
    canvasGradient.addColorStop(stop[i].offset, stop[i].color);
  }

  return canvasGradient;
}

function v(value, dflt) {
  return value == null ? dflt : value;
}
