import Bounds from '../Bounds';
import marks from '../marks/index';

export default function(item, func, opt) {
  var type = marks[item.mark.marktype];
  var bound = func || type.bound;
  if (type.nested) item = item.mark;

  return bound(item.bounds || (item.bounds = new Bounds()), item, opt);
}
