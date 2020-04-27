function devicePixelRatio() {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
}

var pixelRatio = devicePixelRatio();

export default function(canvas, width, height, origin, scaleFactor, ctx, opt) {
  const inDOM = typeof HTMLElement !== 'undefined'
              && canvas instanceof HTMLElement
              && canvas.parentNode != null,
        context = ctx || canvas.getContext('2d'),
        ratio = inDOM ? pixelRatio : scaleFactor;

  if (canvas) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
  }

  for (const key in opt) {
    context[key] = opt[key];
  }

  if (canvas && inDOM && ratio !== 1) {
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  context.pixelRatio = ratio;
  context.setTransform(
    ratio, 0, 0, ratio,
    ratio * origin[0],
    ratio * origin[1]
  );

  return canvas;
}
