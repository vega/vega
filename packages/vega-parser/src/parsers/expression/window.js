var _window = (typeof window !== 'undefined' && window) || null;

export function screen() {
  return _window ? _window.screen : {};
}

export function windowsize() {
  return _window
    ? [_window.innerWidth, _window.innerHeight]
    : [undefined, undefined];
}
