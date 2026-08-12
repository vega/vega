const RESIZE = 'resize',
      // consecutive rounds explainable only by the view resizing its own
      // container before it is treated as circular rather than convergent
      LOOP_LIMIT = 5;

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

  let width = el.clientWidth,   // size the most recent run rendered for
      height = el.clientHeight,
      rendered = null,          // size measured once that run had rendered
      frame = 0,
      running = false,
      rounds = 0,
      warned = false;

  function schedule() {
    if (running || frame) return;
    frame = requestAnimationFrame(update);
  }

  function update() {
    frame = 0;
    if (view._resizeObserver !== observer) return; // finalized or re-initialized

    const w = el.clientWidth,
          h = el.clientHeight;

    if (w === width && h === height) return;

    // A size still equal to the one the previous render produced, yet
    // different from the size that render was for, is the view resizing its
    // own container; anything external would have moved it further by now.
    // Enough of those in a row means no size can satisfy the specification.
    rounds = rendered && w === rendered[0] && h === rendered[1] ? rounds + 1 : 0;

    if (rounds > LOOP_LIMIT) {
      if (!warned) {
        warned = true;
        view.warn('Container size depends on the view it contains; '
          + 'no longer resizing to match it.');
      }
      width = w;
      height = h;
      return;
    }

    width = w;
    height = h;
    running = true;

    listeners.forEach(handler => handler({type: RESIZE, target: el}));

    view.runAsync()
      .catch(error => view.error(error))
      .then(() => {
        running = false;
        rendered = [el.clientWidth, el.clientHeight];
        // notifications that arrived mid-run were dropped by schedule, and the
        // render may have resized the container itself: re-check rather than
        // trust either, so a resize landing mid-render is never lost
        schedule();
      });
  }

  const observer = new ResizeObserver(schedule);

  observer.observe(el);
  view._resizeObserver = observer;
}
