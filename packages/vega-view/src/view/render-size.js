export function width(view) {
  var padding = view.padding();
  return Math.max(0, view._width + padding.left + padding.right);
}

export function height(view) {
  var padding = view.padding();
  return Math.max(0, view._height + padding.top + padding.bottom);
}

export function offset(view) {
  var padding = view.padding(),
      origin = view._origin;
  return [
    padding.left + origin[0],
    padding.top + origin[1]
  ];
}

export function resizeRenderer(view) {
  var origin = offset(view);
  view._renderer.background(view._background);
  view._renderer.resize(width(view), height(view), origin);
  view._handler.origin(origin);
}
