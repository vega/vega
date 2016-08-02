import {isString} from 'vega-util';

var Default = 'default',
    Cursor = 'cursor';

export default function(view) {
  var cursor = view._signals[Cursor];

  // initialize cursor flag
  view._cursor = !cursor || (cursor.value === Default);

  // add cursor signal to dataflow, if needed
  if (!cursor) {
    view._signals[Cursor] = (cursor = view.add({cursor: null}));
  }

  // evaluate cursor on each mousemove event
  view.on(view.events('view', 'mousemove'), cursor,
    function(_, event) {
      var value = cursor.value,
          item = event.item && event.item.cursor || null;
      return isString(value) || value && value[Cursor] === item
        ? value
        : {cursor: item};
    }
  );

  // when cursor signal updates, set visible cursor as needed
  view.add(null, function(_) {
    var value = _.cursor;
    if (isString(value)) {
      view._cursor = (value === Default);
      setCursor(value);
    } else if (view._cursor && value && value.hasOwnProperty(Cursor)) {
      setCursor(value = value[Cursor]);
    }
  }, {cursor: cursor});
}

function setCursor(cursor) {
  // set cursor on document body
  // this ensures cursor applies even if dragging out of view
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.cursor = cursor;
  }
}
