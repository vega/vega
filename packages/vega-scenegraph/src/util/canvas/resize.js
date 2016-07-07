export default function(canvas, w, h, p, retina) {
  var g = canvas.getContext('2d'),
      s = 1;

  canvas.width = w + p.left + p.right;
  canvas.height = h + p.top + p.bottom;

  // if browser canvas, attempt to modify for retina display
  if (retina && typeof HTMLElement !== 'undefined' &&
      canvas instanceof HTMLElement)
  {
    g.pixelratio = (s = pixelRatio(canvas) || 1);
  }

  g.setTransform(s, 0, 0, s, s*p.left, s*p.top);
  return canvas;
}

function pixelRatio(canvas) {
  var g = canvas.getContext('2d');

  // get canvas pixel data
  var devicePixelRatio = window && window.devicePixelRatio || 1,
      backingStoreRatio = (
        g.webkitBackingStorePixelRatio ||
        g.mozBackingStorePixelRatio ||
        g.msBackingStorePixelRatio ||
        g.oBackingStorePixelRatio ||
        g.backingStorePixelRatio) || 1,
      ratio = devicePixelRatio / backingStoreRatio;

  if (devicePixelRatio !== backingStoreRatio) {
    // set actual and visible canvas size
    var w = canvas.width,
        h = canvas.height;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  return ratio;
}
