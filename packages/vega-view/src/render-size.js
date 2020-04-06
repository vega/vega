export function width(view) {
  const padding = view.padding();
  return Math.max(0, view._viewWidth + padding.left + padding.right);
}

export function height(view) {
  const padding = view.padding();
  return Math.max(0, view._viewHeight + padding.top + padding.bottom);
}

export function offset(view) {
  const padding = view.padding();
  const origin = view._origin;
  return [padding.left + origin[0], padding.top + origin[1]];
}

export function resizeRenderer(view) {
  const origin = offset(view);
  const w = width(view);
  const h = height(view);

  view._renderer.background(view.background());
  view._renderer.resize(w, h, origin);
  view._handler.origin(origin);

  view._resizeListeners.forEach(function (handler) {
    try {
      handler(w, h);
    } catch (error) {
      view.error(error);
    }
  });
}
