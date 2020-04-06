import {isString} from 'vega-util';

const Default = 'default';

export default function (view) {
  let cursor = view._signals.cursor;

  // add cursor signal to dataflow, if needed
  if (!cursor) {
    view._signals.cursor = cursor = view.add({user: Default, item: null});
  }

  // evaluate cursor on each mousemove event
  view.on(view.events('view', 'mousemove'), cursor, function (_, event) {
    const value = cursor.value;
    const user = value ? (isString(value) ? value : value.user) : Default;
    const item = (event.item && event.item.cursor) || null;

    return value && user === value.user && item == value.item ? value : {user: user, item: item};
  });

  // when cursor signal updates, set visible cursor
  view.add(
    null,
    function (_) {
      let user = _.cursor;
      let item = this.value;

      if (!isString(user)) {
        item = user.item;
        user = user.user;
      }

      setCursor(user && user !== Default ? user : item || user);

      return item;
    },
    {cursor: cursor}
  );
}

function setCursor(cursor) {
  // set cursor on document body
  // this ensures cursor applies even if dragging out of view
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.cursor = cursor;
  }
}
