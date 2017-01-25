var tape = require('tape'),
    vega = require('../');

tape('field creates a field accessor', function(test) {
  var f = vega.field('x');
  test.equal(typeof f, 'function');
  test.equal(vega.accessorName(f), 'x');
  test.deepEqual(vega.accessorFields(f), ['x']);
  test.equal(f({x:'foo'}), 'foo');
  test.equal(f({x:0}), 0);

  f = vega.field('x\\.y');
  test.equal(typeof f, 'function');
  test.equal(vega.accessorName(f), 'x.y');
  test.deepEqual(vega.accessorFields(f), ['x.y']);
  test.equal(f({'x.y':'foo'}), 'foo');
  test.equal(f({'x.y':0}), 0);

  f = vega.field('[x.y]');
  test.equal(typeof f, 'function');
  test.equal(vega.accessorName(f), 'x.y');
  test.deepEqual(vega.accessorFields(f), ['x.y']);
  test.equal(f({'x.y':'foo'}), 'foo');
  test.equal(f({'x.y':0}), 0);

  f = vega.field("['x.y']");
  test.equal(typeof f, 'function');
  test.equal(vega.accessorName(f), 'x.y');
  test.deepEqual(vega.accessorFields(f), ['x.y']);
  test.equal(f({'x.y':'foo'}), 'foo');
  test.equal(f({'x.y':0}), 0);

  f = vega.field('[1].x');
  test.equal(typeof f, 'function');
  test.equal(vega.accessorName(f), '[1].x');
  test.deepEqual(vega.accessorFields(f), ['[1].x']);
  test.equal(f([{x:'foo'},{x:'bar'}]), 'bar');
  test.equal(f([{x:1},{x:0}]), 0);

  f = vega.field('x["y"].z');
  test.equal(typeof f, 'function');
  test.equal(vega.accessorName(f), 'x["y"].z');
  test.deepEqual(vega.accessorFields(f), ['x["y"].z']);
  test.equal(f({x:{y:{z:'bar'}}}), 'bar');
  test.equal(f({x:{y:{z:0}}}), 0);

  f = vega.field('x[y].z');
  test.equal(typeof f, 'function');
  test.equal(vega.accessorName(f), 'x[y].z');
  test.deepEqual(vega.accessorFields(f), ['x[y].z']);
  test.equal(f({x:{y:{z:'bar'}}}), 'bar');
  test.equal(f({x:{y:{z:0}}}), 0);

  f = vega.field('x["a.b"].z');
  test.equal(typeof f, 'function');
  test.equal(vega.accessorName(f), 'x["a.b"].z');
  test.deepEqual(vega.accessorFields(f), ['x["a.b"].z']);
  test.equal(f({x:{'a.b':{z:'bar'}}}), 'bar');
  test.equal(f({x:{'a.b':{z:0}}}), 0);

  f = vega.field('x[a.b].z');
  test.equal(typeof f, 'function');
  test.equal(vega.accessorName(f), 'x[a.b].z');
  test.deepEqual(vega.accessorFields(f), ['x[a.b].z']);
  test.equal(f({x:{'a.b':{z:'bar'}}}), 'bar');
  test.equal(f({x:{'a.b':{z:0}}}), 0);

  f = vega.field('x[a b].z');
  test.equal(typeof f, 'function');
  test.equal(vega.accessorName(f), 'x[a b].z');
  test.deepEqual(vega.accessorFields(f), ['x[a b].z']);
  test.equal(f({x:{'a b':{z:'bar'}}}), 'bar');
  test.equal(f({x:{'a b':{z:0}}}), 0);

  f = vega.field('x.a b.z');
  test.equal(typeof f, 'function');
  test.equal(vega.accessorName(f), 'x.a b.z');
  test.deepEqual(vega.accessorFields(f), ['x.a b.z']);
  test.equal(f({x:{'a b':{z:'bar'}}}), 'bar');
  test.equal(f({x:{'a b':{z:0}}}), 0);
  test.end();
});
