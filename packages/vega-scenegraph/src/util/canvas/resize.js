export var devicePixelRatio = typeof window !== 'undefined'
  ? window.devicePixelRatio || 1 : 1;

export default function(canvas, width, height, padding) {
  var scale = typeof HTMLElement !== 'undefined'
    && canvas instanceof HTMLElement
    && canvas.parentNode != null;

  var context = canvas.getContext('2d'),
      ratio = scale ? devicePixelRatio : 1,
      w = width + padding.left + padding.right,
      h = height + padding.top + padding.bottom;

  canvas.width = w * ratio;
  canvas.height = h * ratio;

  if (ratio !== 1) {
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  context.pixelRatio = ratio;
  context.setTransform(
    ratio, 0, 0, ratio,
    ratio * padding.left,
    ratio * padding.top
  );

  return canvas;
}
