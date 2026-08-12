const RESIZE = 'resize';

/**
 * Observe the container element and dispatch 'container:resize' events to any
 * event streams registered for them. Does nothing if the specification does
 * not use the container event source, or where ResizeObserver is unavailable.
 * @param {View} view - The view whose container should be observed.
 */
export default function observeContainer(view) {
  if (view._resizeObserver) {
    view._resizeObserver.disconnect();
    view._resizeObserver = null;
  }

  const el = view.container(),
        listeners = view._containerListeners;

  if (typeof ResizeObserver === 'undefined' || !el || !listeners.length) return;

  // the size the listeners last saw, so that the observe-time notification
  // and fractional changes that leave the client size intact dispatch nothing
  let width = el.clientWidth,
      height = el.clientHeight;

  view._resizeObserver = new ResizeObserver(() => {
    if (el.clientWidth === width && el.clientHeight === height) return;
    width = el.clientWidth;
    height = el.clientHeight;
    listeners.forEach(handler => handler({type: RESIZE, target: el}));
  });

  view._resizeObserver.observe(el);
}
