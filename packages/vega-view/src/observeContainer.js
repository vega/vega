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

  let width = el.clientWidth,
      height = el.clientHeight,
      frame = 0,
      running = false;

  function update() {
    frame = 0;
    if (view._resizeObserver !== observer) return; // finalized or re-initialized
    if (el.clientWidth === width && el.clientHeight === height) return;

    running = true;
    listeners.forEach(handler => handler({type: RESIZE, target: el}));

    view.runAsync()
      .catch(error => view.error(error))
      .then(() => {
        // adopt the post-render size: rendering can itself resize a
        // content-sized container, which would otherwise loop back here
        width = el.clientWidth;
        height = el.clientHeight;
        running = false;
      });
  }

  const observer = new ResizeObserver(() => {
    if (running || frame) return;
    frame = requestAnimationFrame(update);
  });

  observer.observe(el);
  view._resizeObserver = observer;
}
