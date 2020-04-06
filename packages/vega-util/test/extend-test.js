const tape = require('tape');
const vega = require('../');

tape('extend extends objects with other object properties', function (t) {
  const grandparent = {p2_1: 'vp2_1', p2_2: 'vp2_2'};
  const parent = Object.create(grandparent);
  const object1 = Object.create(parent);
  const object2 = {o2_1: 'vo2_1', override_1: 'overridden'};

  object1.o1_1 = 'vo1_1';
  object1.o1_2 = 'vo1_2';
  object1.override_1 = 'x';
  parent.p1_1 = 'vp1_1';
  const o = vega.extend({c1: 'vc1', p2_2: 'x', o1_1: 'y'}, object1, object2);

  // should inherit all direct properties
  t.equal(o['o1_1'], 'vo1_1');
  t.equal(o['o1_2'], 'vo1_2');
  t.equal(o['o2_1'], 'vo2_1');

  // should inherit all parent properties
  t.equal(o['p1_1'], 'vp1_1');
  t.equal(o['p2_1'], 'vp2_1');
  t.equal(o['p2_2'], 'vp2_2');

  // should override object properties
  t.equal(o['o1_1'], 'vo1_1');
  t.equal(o['p2_2'], 'vp2_2');

  // should override values from previous arguments
  t.equal(o['override_1'], 'overridden');

  t.end();
});
