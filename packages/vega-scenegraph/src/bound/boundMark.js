import Bounds from '../Bounds';
import boundItem from './boundItem';
import marks from '../marks/index';

var DUMMY = {mark: null};

export default function(mark, bounds, opt) {
  var type  = marks[mark.marktype],
      bound = type.bound,
      items = mark.items,
      hasItems = items && items.length,
      i, n, item, b;

  if (type.nested) {
    item = hasItems ? items[0] : (DUMMY.mark = mark, DUMMY); // no items, fake it
    b = boundItem(item, bound, opt);
    bounds = bounds && bounds.union(b) || b;
    return bounds;
  }

  bounds = bounds
    || mark.bounds && mark.bounds.clear()
    || new Bounds();

  if (hasItems) {
    for (i=0, n=items.length; i<n; ++i) {
      bounds.union(boundItem(items[i], bound, opt));
    }
  }

  return mark.bounds = bounds;
}
