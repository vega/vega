var vega = require('../');

test('field creates a field accessor', function() {
  var f = vega.field('x');
  expect(typeof f).toBe('function');
  expect(vega.accessorName(f)).toBe('x');
  expect(vega.accessorFields(f)).toEqual(['x']);
  expect(f({x:'foo'})).toBe('foo');
  expect(f({x:0})).toBe(0);

  f = vega.field('x\\.y');
  expect(typeof f).toBe('function');
  expect(vega.accessorName(f)).toBe('x.y');
  expect(vega.accessorFields(f)).toEqual(['x.y']);
  expect(f({'x.y':'foo'})).toBe('foo');
  expect(f({'x.y':0})).toBe(0);

  f = vega.field('[x.y]');
  expect(typeof f).toBe('function');
  expect(vega.accessorName(f)).toBe('x.y');
  expect(vega.accessorFields(f)).toEqual(['x.y']);
  expect(f({'x.y':'foo'})).toBe('foo');
  expect(f({'x.y':0})).toBe(0);

  f = vega.field("['x.y']");
  expect(typeof f).toBe('function');
  expect(vega.accessorName(f)).toBe('x.y');
  expect(vega.accessorFields(f)).toEqual(['x.y']);
  expect(f({'x.y':'foo'})).toBe('foo');
  expect(f({'x.y':0})).toBe(0);

  f = vega.field('[1].x');
  expect(typeof f).toBe('function');
  expect(vega.accessorName(f)).toBe('[1].x');
  expect(vega.accessorFields(f)).toEqual(['[1].x']);
  expect(f([{x:'foo'},{x:'bar'}])).toBe('bar');
  expect(f([{x:1},{x:0}])).toBe(0);

  f = vega.field('x["y"].z');
  expect(typeof f).toBe('function');
  expect(vega.accessorName(f)).toBe('x["y"].z');
  expect(vega.accessorFields(f)).toEqual(['x["y"].z']);
  expect(f({x:{y:{z:'bar'}}})).toBe('bar');
  expect(f({x:{y:{z:0}}})).toBe(0);

  f = vega.field('x[y].z');
  expect(typeof f).toBe('function');
  expect(vega.accessorName(f)).toBe('x[y].z');
  expect(vega.accessorFields(f)).toEqual(['x[y].z']);
  expect(f({x:{y:{z:'bar'}}})).toBe('bar');
  expect(f({x:{y:{z:0}}})).toBe(0);

  f = vega.field('x["a.b"].z');
  expect(typeof f).toBe('function');
  expect(vega.accessorName(f)).toBe('x["a.b"].z');
  expect(vega.accessorFields(f)).toEqual(['x["a.b"].z']);
  expect(f({x:{'a.b':{z:'bar'}}})).toBe('bar');
  expect(f({x:{'a.b':{z:0}}})).toBe(0);

  f = vega.field('x[a.b].z');
  expect(typeof f).toBe('function');
  expect(vega.accessorName(f)).toBe('x[a.b].z');
  expect(vega.accessorFields(f)).toEqual(['x[a.b].z']);
  expect(f({x:{'a.b':{z:'bar'}}})).toBe('bar');
  expect(f({x:{'a.b':{z:0}}})).toBe(0);

  f = vega.field('x[a b].z');
  expect(typeof f).toBe('function');
  expect(vega.accessorName(f)).toBe('x[a b].z');
  expect(vega.accessorFields(f)).toEqual(['x[a b].z']);
  expect(f({x:{'a b':{z:'bar'}}})).toBe('bar');
  expect(f({x:{'a b':{z:0}}})).toBe(0);

  f = vega.field('x.a b.z');
  expect(typeof f).toBe('function');
  expect(vega.accessorName(f)).toBe('x.a b.z');
  expect(vega.accessorFields(f)).toEqual(['x.a b.z']);
  expect(f({x:{'a b':{z:'bar'}}})).toBe('bar');
  expect(f({x:{'a b':{z:0}}})).toBe(0);
});
