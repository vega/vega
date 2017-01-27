export function resizer(view, field) {
  var op = view.add(null,
    function(_) {
      view['_' + field] = _.size;
      view._autosize = view._resize = 1;
    },
    {size: view._signals[field]}
  );
  // set rank to ensure operator runs as soon as possible
  // size parameters should be reset prior to view layout
  return op.rank = 0, op;
}

export function autosize(viewWidth, viewHeight, width, height, origin, auto) {
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
    if (view._width !== viewWidth) {
      view._resize = 1;
      view._width = viewWidth;
    }

    // view height changed: update view property, set resize flag
    if (view._height !== viewHeight) {
      view._resize = 1;
      view._height = viewHeight;
    }

    // origin changed: update view property, set resize flag
    if (view._origin[0] !== origin[0] || view._origin[1] !== origin[1]) {
      view._resize = 1;
      view._origin = origin;
    }

    // run dataflow on width/height signal change
    if (rerun) view.run('enter');
    if (auto) view.runAfter(function() { view._autosize = 1; });
  });
}
