var _window = (typeof window !== 'undefined' && window) || null;

export function screen() {
  return _window ? _window.screen : {};
}

export function windowSize() {
  return _window
    ? [_window.innerWidth, _window.innerHeight]
    : [undefined, undefined];
}

export function containerSize() {
  var view = this.context.dataflow,
      el = view.container && view.container();
  return el
    ? [el.clientWidth, el.clientHeight]
    : [undefined, undefined];
}
