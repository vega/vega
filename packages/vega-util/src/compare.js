import {default as accessor, accessorFields} from './accessor';
import {identity} from './accessors';
import array from './array';
import field from './field';
import isFunction from './isFunction';

const DESC = 'descending';

function _compare(u, v) {
  return (u < v || u == null) && v != null ? -1
    : (u > v || v == null) && u != null ? 1
    : ((v = v instanceof Date ? +v : v), (u = u instanceof Date ? +u : u)) !== u && v === v ? -1
    : v !== v && u === u ? 1
    : 0;
}

export default function(fields, orders) {
  orders = array(orders);
  const ord = [],
        cmp = array(fields)
                .map((f, i) => f == null ? null :
                  (ord.push(orders && orders[i] === DESC ? -1 : 1),
                   isFunction(f) ? f : field(f)))
                .filter(identity),
        n = cmp.length;

  if (n <= 0) return null;

  const f = function(a, b) {
    let f, c, i = -1;
    while (++i < n) {
      f = cmp[i];
      c = _compare(f(a), f(b));
      if (c) return ord[i] * c;
    }
    return 0;
  };

  fields = {};
  cmp.forEach(field => {
    (accessorFields(field) || []).forEach(_ => fields[_] = 1);
  });

  return accessor(f, Object.keys(fields));
}
