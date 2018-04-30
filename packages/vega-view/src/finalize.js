/**
 * Finalize a View instance that is being removed.
 * Remove all external event listeners.
 * Remove any currently displayed tooltip.
 */
export default function() {
  var tooltip = this._tooltip,
      listeners = this._eventListeners,
      n = listeners.length, m, e;

  while (--n >= 0) {
    e = listeners[n];
    m = e.sources.length;
    while (--m >= 0) {
      e.sources[m].removeEventListener(e.type, e.handler);
    }
  }

  if (tooltip) {
    tooltip.call(this, this._handler, null, null, null);
  }
}
