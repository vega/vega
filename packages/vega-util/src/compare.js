import accessor from './accessor';
import array from './array';
import splitAccessPath from './splitAccessPath';
import stringValue from './stringValue';

export default function(fields, orders) {
  if (fields == null) return null;
  fields = array(fields);

  var cmp = fields.map(function(f) {
        return splitAccessPath(f).map(stringValue).join('][');
      }),
      ord = array(orders),
      n = cmp.length - 1,
      code = 'var u,v;return ', i, f, u, v, d, lt, gt;

  for (i=0; i<=n; ++i) {
    f = cmp[i];
    u = '(u=a['+f+'])';
    v = '(v=b['+f+'])';
    d = '((v=v instanceof Date?+v:v),(u=u instanceof Date?+u:u))';
    lt = ord[i] !== 'descending' ? (gt=1, -1) : (gt=-1, 1);
    code += '(' + u+'<'+v+'||u==null)&&v!=null?' + lt
      + ':(u>v||v==null)&&u!=null?' + gt
      + ':'+d+'!==u&&v===v?' + lt
      + ':v!==v&&u===u?' + gt
      + (i < n ? ':' : ':0');
  }
  return accessor(Function('a', 'b', code + ';'), fields);
}