var vega = require('../');

test('compare compares numbers', function() {
  var c = vega.compare('x');
  expect(c({x:1}, {x:0})).toBe(1);
  expect(c({x:0}, {x:1})).toBe(-1);
  expect(c({x:1}, {x:1})).toBe(0);
  expect(c({x:0}, {x:null})).toBe(1);
  expect(c({x:null}, {x:0})).toBe(-1);
  expect(c({x:-1}, {x:null})).toBe(1);
  expect(c({x:null}, {x:-1})).toBe(-1);
  expect(c({x:0}, {x:undefined})).toBe(1);
  expect(c({x:undefined}, {x:0})).toBe(-1);
  expect(c({x:0}, {x:NaN})).toBe(1);
  expect(c({x:NaN}, {x:0})).toBe(-1);
});

test('compare compares strings', function() {
  var c = vega.compare('x');
  expect(c({x:'b'}, {x:'a'})).toBe(1);
  expect(c({x:'a'}, {x:'b'})).toBe(-1);
  expect(c({x:'b'}, {x:'b'})).toBe(0);
  expect(c({x:'a'}, {x:''})).toBe(1);
  expect(c({x:''}, {x:'a'})).toBe(-1);
  expect(c({x:''}, {x:null})).toBe(1);
  expect(c({x:null}, {x:''})).toBe(-1);
  expect(c({x:''}, {x:undefined})).toBe(1);
  expect(c({x:undefined}, {x:''})).toBe(-1);
  expect(c({x:''}, {x:NaN})).toBe(1);
  expect(c({x:NaN}, {x:''})).toBe(-1);
});

test('compare compares dates', function() {
  var c = vega.compare('x');
  expect(c({x:new Date(1)}, {x:new Date(0)})).toBe(1);
  expect(c({x:new Date(0)}, {x:new Date(1)})).toBe(-1);
  expect(c({x:new Date(1)}, {x:new Date(1)})).toBe(0);
  expect(c({x:new Date(0)}, {x:new Date(NaN)})).toBe(1);
  expect(c({x:new Date(NaN)}, {x:new Date(0)})).toBe(-1);
  expect(c({x:new Date(NaN)}, {x:new Date(NaN)})).toBe(0);
  expect(c({x:new Date(0)}, {x:null})).toBe(1);
  expect(c({x:null}, {x:new Date(0)})).toBe(-1);
  expect(c({x:new Date(0)}, {x:undefined})).toBe(1);
  expect(c({x:undefined}, {x:new Date(0)})).toBe(-1);
  expect(c({x:new Date(0)}, {x:NaN})).toBe(1);
  expect(c({x:NaN}, {x:new Date(0)})).toBe(-1);
});

test('compare compares null, undefined and NaN', function() {
  var c = vega.compare('x');
  // null and undefined are treated as equivalent
  expect(c({x:null}, {x:undefined})).toBe(0);
  expect(c({x:undefined}, {x:null})).toBe(0);
  // NaN is greater than null or undefined
  expect(c({x:null}, {x:NaN})).toBe(-1);
  expect(c({x:NaN}, {x:null})).toBe(1);
  expect(c({x:undefined}, {x:NaN})).toBe(-1);
  expect(c({x:NaN}, {x:undefined})).toBe(1);
  // values are equivalent to themselves
  expect(c({x:null}, {x:null})).toBe(0);
  expect(c({x:undefined}, {x:undefined})).toBe(0);
  expect(c({x:NaN}, {x:NaN})).toBe(0);
});

test('compare supports descending order', function() {
  var c = vega.compare('x', 'descending');
  expect(c({x:1}, {x:0})).toBe(-1);
  expect(c({x:0}, {x:1})).toBe(1);
  expect(c({x:1}, {x:1})).toBe(0);
  expect(vega.accessorFields(c)).toEqual(['x']);
});

test('compare supports nested comparison', function() {
  var c = vega.compare(['x', 'y'], ['descending', 'ascending']);
  expect(c({x:1,y:0}, {x:0,y:1})).toBe(-1);
  expect(c({x:0,y:1}, {x:1,y:0})).toBe(1);
  expect(c({x:0,y:0}, {x:0,y:1})).toBe(-1);
  expect(c({x:0,y:1}, {x:0,y:0})).toBe(1);
  expect(c({x:0,y:0}, {x:0,y:0})).toBe(0);
  expect(vega.accessorFields(c)).toEqual(['x', 'y']);
});

test('compare supports accessor functions', function() {
  var fx = vega.field('x'),
      fy = vega.field('y'),
      c = vega.compare([fx, fy], ['descending', 'ascending']);
  expect(c({x:1,y:0}, {x:0,y:1})).toBe(-1);
  expect(c({x:0,y:1}, {x:1,y:0})).toBe(1);
  expect(c({x:0,y:0}, {x:0,y:1})).toBe(-1);
  expect(c({x:0,y:1}, {x:0,y:0})).toBe(1);
  expect(c({x:0,y:0}, {x:0,y:0})).toBe(0);
  expect(vega.accessorFields(c)).toEqual(['x', 'y']);
});
