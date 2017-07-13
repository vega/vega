var Padding = 'padding';

export function viewWidth(view, width) {
  var a = view.autosize(),
      p = view.padding();
  return width - (a && a.contains === Padding ? p.left + p.right : 0);
}

export function viewHeight(view, height) {
  var a = view.autosize(),
      p = view.padding();
  return height - (a && a.contains === Padding ? p.top + p.bottom : 0);
}

export function initializeResize(view) {
  function resetSize() {
    view._autosize = view._resize = 1;
  }

  // respond to width signal
  view._resizeWidth = view.add(null,
    function(_) {
      view._width = _.size;
      view._viewWidth = viewWidth(view, _.size);
      resetSize();
    },
    {size: view._signals.width}
  );

  // respond to height signal
  view._resizeHeight = view.add(null,
    function(_) {
      view._height = _.size;
      view._viewHeight = viewHeight(view, _.size);
      resetSize();
    },
    {size: view._signals.height}
  );

  // respond to padding signal
  var resizePadding = view.add(null,
    resetSize,
    {pad: view._signals.padding}
  );

  // set rank to ensure operators run as soon as possible
  // size parameters should be reset prior to view layout
  view._resizeWidth.rank = 0;
  view._resizeHeight.rank = 0;
  resizePadding.rank = 0;
}

export function resize(viewWidth, viewHeight, width, height, origin, auto) {
  this.runAfter(function(view) {
    var rerun = 0;

    // reset autosize flag
    view._autosize = 0;

    // width value changed: update signal, skip resize op
    if (view.width() !== width) {
      rerun = 1;
      view.width(width);
      view._resizeWidth.skip(true);
    }

    // height value changed: update signal, skip resize op
    if (view.height() !== height) {
      rerun = 1;
      view.height(height);
      view._resizeHeight.skip(true);
    }

    // view width changed: update view property, set resize flag
    if (view._viewWidth !== viewWidth) {
      view._resize = 1;
      view._viewWidth = viewWidth;
    }

    // view height changed: update view property, set resize flag
    if (view._viewHeight !== viewHeight) {
      view._resize = 1;
      view._viewHeight = viewHeight;
    }

    // origin changed: update view property, set resize flag
    if (view._origin[0] !== origin[0] || view._origin[1] !== origin[1]) {
      view._resize = 1;
      view._origin = origin;
    }

    // run dataflow on width/height signal change
    if (rerun) view.run('enter');
    if (auto) view.runAfter(function() { view.resize(); });
  });
}
