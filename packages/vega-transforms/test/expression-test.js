import tape from 'tape';
import { accessor, accessorFields, accessorName } from 'vega-util';
import * as vega from 'vega-dataflow';
import { expression } from '../index.js';
var Expr = { expression }.expression;

tape('Expression wraps expression functions', t => {
  var df = new vega.Dataflow(),
      f = accessor(
            (d, _) => d.value + _.offset,
            ['value'], 'shift'
          ),
      o = df.add(2),
      e = df.add(Expr, {expr: f, offset: o});

  df.run();
  t.equal(typeof e.value, 'function');
  t.equal(accessorName(e.value), 'shift');
  t.deepEqual(accessorFields(e.value), ['value']);
  t.equal(e.value({value: 2}), 4);

  df.update(o, 5).run();
  t.equal(typeof e.value, 'function');
  t.equal(accessorName(e.value), 'shift');
  t.deepEqual(accessorFields(e.value), ['value']);
  t.equal(e.value({value: 2}), 7);

  t.end();
});
