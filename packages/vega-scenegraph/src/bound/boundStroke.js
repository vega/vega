export default function(bounds, item, miter) {
  if (item.stroke && item.opacity !== 0 && item.strokeOpacity !== 0) {
    const sw = item.strokeWidth != null ? +item.strokeWidth : 1;
    // stroke is centered on the path, extending half its width to either side;
    // square caps on diagonal segments extend up to sqrt(2)/2 of the width
    let e = (item.strokeCap === 'square' ? Math.SQRT2 : 1) * sw / 2;
    if (miter && (!item.strokeJoin || item.strokeJoin === 'miter')) {
      // miter join tips extend up to miterLimit/2 stroke widths past a vertex,
      // capped here at the SVG default limit of 4
      e = Math.max(e, Math.min(item.strokeMiterLimit != null ? +item.strokeMiterLimit : 4, 4) * sw / 2);
    }
    bounds.expand(e);
  }
  return bounds;
}
