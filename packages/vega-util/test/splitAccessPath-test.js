var tape = require('tape'),
    vega = require('../');

tape('splitAccessPath parses field accessor paths', t => {
  t.deepEqual(vega.splitAccessPath('x'), ['x']);
  t.deepEqual(vega.splitAccessPath('x\\'), ['x']);
  t.deepEqual(vega.splitAccessPath('\\x'), ['x']);
  t.deepEqual(vega.splitAccessPath('x\\.y'), ['x.y']);
  t.deepEqual(vega.splitAccessPath('[x.y]'), ['x.y']);
  t.deepEqual(vega.splitAccessPath("['x.y']"), ['x.y']);
  t.deepEqual(vega.splitAccessPath('[1].x'), ['1', 'x']);
  t.deepEqual(vega.splitAccessPath('x["y"].z'), ['x', 'y', 'z']);
  t.deepEqual(vega.splitAccessPath('x[y].z'), ['x', 'y', 'z']);
  t.deepEqual(vega.splitAccessPath('x["a.b"].z'), ['x', 'a.b', 'z']);
  t.deepEqual(vega.splitAccessPath('x[a.b].z'), ['x', 'a.b', 'z']);
  t.deepEqual(vega.splitAccessPath('x[a b].z'), ['x', 'a b', 'z']);
  t.deepEqual(vega.splitAccessPath('x.a b.z'), ['x', 'a b', 'z']);
  t.deepEqual(vega.splitAccessPath('y\\[foo\\]'), ['y[foo]']);
  t.deepEqual(vega.splitAccessPath('y\\[foo'), ['y[foo']);
  t.deepEqual(vega.splitAccessPath('yfoo\\]'), ['yfoo]']);
  t.end();
});

