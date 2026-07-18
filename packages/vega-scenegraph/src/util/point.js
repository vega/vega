export default function(event, el) {
  if (el.getScreenCTM) {
    const p = ctmPoint(event, el.getScreenCTM());
    if (p) return p;
  }
  return rectPoint(event, el, el.getBoundingClientRect());
}

// map a client point to element coordinates by inverting the screen CTM,
// compensating for any CSS transforms on ancestor elements
export function ctmPoint(event, ctm) {
  if (!ctm) return null;
  const det = ctm.a * ctm.d - ctm.b * ctm.c;
  if (!det) return null;
  const x = event.clientX - ctm.e,
        y = event.clientY - ctm.f;
  return [
    (ctm.d * x - ctm.c * y) / det,
    (ctm.a * y - ctm.b * x) / det
  ];
}

// map a client point to element coordinates using bounding rect geometry,
// unscaling (bounding rect size over untransformed layout size) to
// compensate for CSS transforms before subtracting layout-unit borders
export function rectPoint(event, el, rect) {
  const sx = el.offsetWidth ? rect.width / el.offsetWidth : 1,
        sy = el.offsetHeight ? rect.height / el.offsetHeight : 1;
  return [
    (event.clientX - rect.left) / sx - (el.clientLeft || 0),
    (event.clientY - rect.top) / sy - (el.clientTop || 0)
  ];
}
