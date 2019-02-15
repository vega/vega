import {SortOrder} from '../../vega-typings';
import accessor, { accessorFields, AccessorFn } from './accessor';
import array from './array';
import isFunction from './isFunction';
import splitAccessPath from './splitAccessPath';
import stringValue from './stringValue';

export default function(fields: string | string[] | AccessorFn | AccessorFn[], orders?: SortOrder | SortOrder[]) {
  var idx: number[] = [],
      fieldsAny = fields as any,  // fixme
      cmp = (fieldsAny = array(fieldsAny)).map(function(f: any, i: number) {
        if (f == null) {
          return null;
        } else {
          idx.push(i);
          return isFunction(f) ? f
            : splitAccessPath(f).map(stringValue).join('][');
        }
      }),
      n = idx.length - 1,
      ord = array(orders),
      code = 'var u,v;return ',
      i, j, f, u, v, d, t, lt, gt;

  if (n < 0) return null;

  for (j=0; j<=n; ++j) {
    i = idx[j];
    f = cmp[i];

    if (isFunction(f)) {
      d = 'f' + i;
      u = '(u=this.' + d + '(a))';
      v = '(v=this.' + d + '(b))';
      (t = t || {} as any)[d] = f;
    } else {
      u = '(u=a['+f+'])';
      v = '(v=b['+f+'])';
    }

    d = '((v=v instanceof Date?+v:v),(u=u instanceof Date?+u:u))';

    if (ord[i] !== 'descending') {
      gt = 1;
      lt = -1;
    } else {
      gt = -1;
      lt = 1;
    }

    code += '(' + u+'<'+v+'||u==null)&&v!=null?' + lt
      + ':(u>v||v==null)&&u!=null?' + gt
      + ':'+d+'!==u&&v===v?' + lt
      + ':v!==v&&u===u?' + gt
      + (i < n ? ':' : ':0');
  }

  f = Function('a', 'b', code + ';');
  if (t) f = f.bind(t);

  fieldsAny = fieldsAny.reduce(function(map: {[key: string]: number}, field: any) {
    if (isFunction(field)) {
      (accessorFields(field) || []).forEach(function(_) { map[_] = 1; });
    } else if (field != null) {
      map[field + ''] = 1;
    }
    return map;
  }, {});

  return accessor(f, Object.keys(fieldsAny));
}
