export default function() {
  const view = this;

  // disconnect a pre-existing observer
  if (view._resizeObserver) {
    view._resizeObserver.disconnect();
    view._resizeObserver = null;
  }

  const el = view.container();

  if (!el || typeof ResizeObserver === 'undefined') return;

  let lastWidth = el.clientWidth,
      lastHeight = el.clientHeight;

  const observer = new ResizeObserver(() => {
    const width = el.clientWidth,
          height = el.clientHeight;
    // ignore notifications that don't change  measured container size
    if (width === lastWidth && height === lastHeight) return;
    lastWidth = width;
    lastHeight = height;
    view.resize().runAsync();
  });

  observer.observe(el);
  view._resizeObserver = observer;
}
