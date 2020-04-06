import Bounds from '../Bounds';
import marks from '../marks/index';

export default function (item, func, opt) {
  const type = marks[item.mark.marktype];
  const bound = func || type.bound;
  if (type.nested) item = item.mark;

  return bound(item.bounds || (item.bounds = new Bounds()), item, opt);
}
