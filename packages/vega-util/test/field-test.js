var tape = require('tape'),
    vega = require('../');

tape('field creates a field accessor', t => {
  let f = vega.field('x');
  t.equal(typeof f, 'function');
  t.equal(vega.accessorName(f), 'x');
  t.deepEqual(vega.accessorFields(f), ['x']);
  t.equal(f({x:'foo'}), 'foo');
  t.equal(f({x:0}), 0);

  f = vega.field('x\\.y');
  t.equal(typeof f, 'function');
  t.equal(vega.accessorName(f), 'x.y');
  t.deepEqual(vega.accessorFields(f), ['x.y']);
  t.equal(f({'x.y':'foo'}), 'foo');
  t.equal(f({'x.y':0}), 0);

  f = vega.field('[x.y]');
  t.equal(typeof f, 'function');
  t.equal(vega.accessorName(f), 'x.y');
  t.deepEqual(vega.accessorFields(f), ['x.y']);
  t.equal(f({'x.y':'foo'}), 'foo');
  t.equal(f({'x.y':0}), 0);

  f = vega.field("['x.y']");
  t.equal(typeof f, 'function');
  t.equal(vega.accessorName(f), 'x.y');
  t.deepEqual(vega.accessorFields(f), ['x.y']);
  t.equal(f({'x.y':'foo'}), 'foo');
  t.equal(f({'x.y':0}), 0);

  f = vega.field('[1].x');
  t.equal(typeof f, 'function');
  t.equal(vega.accessorName(f), '[1].x');
  t.deepEqual(vega.accessorFields(f), ['[1].x']);
  t.equal(f([{x:'foo'},{x:'bar'}]), 'bar');
  t.equal(f([{x:1},{x:0}]), 0);

  f = vega.field('x["y"].z');
  t.equal(typeof f, 'function');
  t.equal(vega.accessorName(f), 'x["y"].z');
  t.deepEqual(vega.accessorFields(f), ['x["y"].z']);
  t.equal(f({x:{y:{z:'bar'}}}), 'bar');
  t.equal(f({x:{y:{z:0}}}), 0);

  f = vega.field('x[y].z');
  t.equal(typeof f, 'function');
  t.equal(vega.accessorName(f), 'x[y].z');
  t.deepEqual(vega.accessorFields(f), ['x[y].z']);
  t.equal(f({x:{y:{z:'bar'}}}), 'bar');
  t.equal(f({x:{y:{z:0}}}), 0);

  f = vega.field('x["a.b"].z');
  t.equal(typeof f, 'function');
  t.equal(vega.accessorName(f), 'x["a.b"].z');
  t.deepEqual(vega.accessorFields(f), ['x["a.b"].z']);
  t.equal(f({x:{'a.b':{z:'bar'}}}), 'bar');
  t.equal(f({x:{'a.b':{z:0}}}), 0);

  f = vega.field('x[a.b].z');
  t.equal(typeof f, 'function');
  t.equal(vega.accessorName(f), 'x[a.b].z');
  t.deepEqual(vega.accessorFields(f), ['x[a.b].z']);
  t.equal(f({x:{'a.b':{z:'bar'}}}), 'bar');
  t.equal(f({x:{'a.b':{z:0}}}), 0);

  f = vega.field('x[a b].z');
  t.equal(typeof f, 'function');
  t.equal(vega.accessorName(f), 'x[a b].z');
  t.deepEqual(vega.accessorFields(f), ['x[a b].z']);
  t.equal(f({x:{'a b':{z:'bar'}}}), 'bar');
  t.equal(f({x:{'a b':{z:0}}}), 0);

  f = vega.field('x.a b.z');
  t.equal(typeof f, 'function');
  t.equal(vega.accessorName(f), 'x.a b.z');
  t.deepEqual(vega.accessorFields(f), ['x.a b.z']);
  t.equal(f({x:{'a b':{z:'bar'}}}), 'bar');
  t.equal(f({x:{'a b':{z:0}}}), 0);
  t.end();
});
