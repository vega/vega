import Bounds from '../Bounds';
import marks from '../marks/index';

export default function(item, func, opt) {
  var type = marks[item.mark.marktype],
      bound = func || type.bound;
  if (type.nested) item = item.mark;

  var curr = item.bounds,
      prev = item.bounds_prev || (item.bounds_prev = new Bounds());

  if (curr) {
    prev.clear().union(curr);
    curr.clear();
  } else {
    item.bounds = new Bounds();
  }

  bound(item.bounds, item, opt);
  if (!curr) prev.clear().union(item.bounds);

  return item.bounds;
}
