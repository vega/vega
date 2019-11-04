export default function(bounds, item, pad) {
  if (item.stroke && item.opacity !== 0 && item.strokeOpacity !== 0) {
    bounds.expand(
      (pad || 0) +
      (item.strokeWidth != null ? +item.strokeWidth : 1)
    );
  }
  return bounds;
}
