var tape = require('tape'),
    vega = require('../');

tape('compare compares numbers', t => {
  const c = vega.compare('x');
  t.equal(c({x:1}, {x:0}), 1);
  t.equal(c({x:0}, {x:1}), -1);
  t.equal(c({x:1}, {x:1}), 0);
  t.equal(c({x:0}, {x:null}), 1);
  t.equal(c({x:null}, {x:0}), -1);
  t.equal(c({x:-1}, {x:null}), 1);
  t.equal(c({x:null}, {x:-1}), -1);
  t.equal(c({x:0}, {x:undefined}), 1);
  t.equal(c({x:undefined}, {x:0}), -1);
  t.equal(c({x:0}, {x:NaN}), 1);
  t.equal(c({x:NaN}, {x:0}), -1);
  t.end();
});

tape('compare compares strings', t => {
  const c = vega.compare('x');
  t.equal(c({x:'b'}, {x:'a'}), 1);
  t.equal(c({x:'a'}, {x:'b'}), -1);
  t.equal(c({x:'b'}, {x:'b'}), 0);
  t.equal(c({x:'a'}, {x:''}), 1);
  t.equal(c({x:''}, {x:'a'}), -1);
  t.equal(c({x:''}, {x:null}), 1);
  t.equal(c({x:null}, {x:''}), -1);
  t.equal(c({x:''}, {x:undefined}), 1);
  t.equal(c({x:undefined}, {x:''}), -1);
  t.equal(c({x:''}, {x:NaN}), 1);
  t.equal(c({x:NaN}, {x:''}), -1);
  t.end();
});

tape('compare compares dates', t => {
  const c = vega.compare('x');
  t.equal(c({x:new Date(1)}, {x:new Date(0)}), 1);
  t.equal(c({x:new Date(0)}, {x:new Date(1)}), -1);
  t.equal(c({x:new Date(1)}, {x:new Date(1)}), 0);
  t.equal(c({x:new Date(0)}, {x:new Date(NaN)}), 1);
  t.equal(c({x:new Date(NaN)}, {x:new Date(0)}), -1);
  t.equal(c({x:new Date(NaN)}, {x:new Date(NaN)}), 0);
  t.equal(c({x:new Date(0)}, {x:null}), 1);
  t.equal(c({x:null}, {x:new Date(0)}), -1);
  t.equal(c({x:new Date(0)}, {x:undefined}), 1);
  t.equal(c({x:undefined}, {x:new Date(0)}), -1);
  t.equal(c({x:new Date(0)}, {x:NaN}), 1);
  t.equal(c({x:NaN}, {x:new Date(0)}), -1);
  t.end();
});

tape('compare compares null, undefined and NaN', t => {
  const c = vega.compare('x');
  // null and undefined are treated as equivalent
  t.equal(c({x:null}, {x:undefined}), 0);
  t.equal(c({x:undefined}, {x:null}), 0);
  // NaN is greater than null or undefined
  t.equal(c({x:null}, {x:NaN}), -1);
  t.equal(c({x:NaN}, {x:null}), 1);
  t.equal(c({x:undefined}, {x:NaN}), -1);
  t.equal(c({x:NaN}, {x:undefined}), 1);
  // values are equivalent to themselves
  t.equal(c({x:null}, {x:null}), 0);
  t.equal(c({x:undefined}, {x:undefined}), 0);
  t.equal(c({x:NaN}, {x:NaN}), 0);
  t.end();
});

tape('compare supports descending order', t => {
  const c = vega.compare('x', 'descending');
  t.equal(c({x:1}, {x:0}), -1);
  t.equal(c({x:0}, {x:1}), 1);
  t.equal(c({x:1}, {x:1}), -0);
  t.deepEqual(vega.accessorFields(c), ['x']);
  t.end();
});

tape('compare supports nested comparison', t => {
  const c = vega.compare(['x', 'y'], ['descending', 'ascending']);
  t.equal(c({x:1,y:0}, {x:0,y:1}), -1);
  t.equal(c({x:0,y:1}, {x:1,y:0}), 1);
  t.equal(c({x:0,y:0}, {x:0,y:1}), -1);
  t.equal(c({x:0,y:1}, {x:0,y:0}), 1);
  t.equal(c({x:0,y:0}, {x:0,y:0}), 0);
  t.deepEqual(vega.accessorFields(c), ['x', 'y']);
  t.end();
});

tape('compare supports accessor functions', t => {
  var fx = vega.field('x'),
      fy = vega.field('y'),
      c = vega.compare([fx, fy], ['descending', 'ascending']);
  t.equal(c({x:1,y:0}, {x:0,y:1}), -1);
  t.equal(c({x:0,y:1}, {x:1,y:0}), 1);
  t.equal(c({x:0,y:0}, {x:0,y:1}), -1);
  t.equal(c({x:0,y:1}, {x:0,y:0}), 1);
  t.equal(c({x:0,y:0}, {x:0,y:0}), 0);
  t.deepEqual(vega.accessorFields(c), ['x', 'y']);
  t.end();
});
