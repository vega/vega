export default function(context, gradient, bounds) {
  const w = bounds.width(),
        h = bounds.height(),
        stop = gradient.stops,
        n = stop.length;

  const canvasGradient = gradient.gradient === 'radial'
    ? context.createRadialGradient(
        bounds.x1 + (gradient.x1 || 0.5) * w,
        bounds.y1 + (gradient.y1 || 0.5) * h,
        Math.max(w, h) * (gradient.r1 || 0),
        bounds.x1 + (gradient.x2 || 0.5) * w,
        bounds.y1 + (gradient.y2 || 0.5) * h,
        Math.max(w, h) * (gradient.r2 || 0.5)
      )
    : context.createLinearGradient(
        bounds.x1 + (gradient.x1 || 0) * w,
        bounds.y1 + (gradient.y1 || 0) * h,
        bounds.x1 + (gradient.x2 || 1) * w,
        bounds.y1 + (gradient.y2 || 0) * h
      );

  for (let i=0; i<n; ++i) {
    canvasGradient.addColorStop(stop[i].offset, stop[i].color);
  }

  return canvasGradient;
}
