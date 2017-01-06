var _window = (typeof window !== 'undefined' && window) || null;

export function open(uri, name) {
  var df = this.context.dataflow;
  if (_window && _window.open) {
    df.loader().sanitize(uri, {context:'open', name:name})
      .then(function(url) { _window.open(url, name); })
      .catch(function(e) { df.warn('Open url failed: ' + e); });
  } else {
    df.warn('Open function can only be invoked in a browser.');
  }
}

export function screen() {
  return _window ? _window.screen : {};
}

export function windowsize() {
  return _window
    ? [_window.innerWidth, _window.innerHeight]
    : [undefined, undefined];
}
