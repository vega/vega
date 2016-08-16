var tape = require('tape'),
    vega = require('../');

tape('extend extends objects with other object properties', function(test) {
  var grandparent = {p2_1: 'vp2_1', p2_2: 'vp2_2'},
      parent = Object.create(grandparent),
      object1 = Object.create(parent),
      object2 = {o2_1: 'vo2_1', override_1: 'overridden'};

  object1.o1_1 = 'vo1_1';
  object1.o1_2 = 'vo1_2';
  object1.override_1 = 'x';
  parent.p1_1 = 'vp1_1';
  var o = vega.extend({c1: 'vc1', p2_2: 'x', o1_1: 'y'}, object1, object2);

  // should inherit all direct properties
  test.equal(o['o1_1'], 'vo1_1');
  test.equal(o['o1_2'], 'vo1_2');
  test.equal(o['o2_1'], 'vo2_1');

  // should inherit all parent properties
  test.equal(o['p1_1'], 'vp1_1');
  test.equal(o['p2_1'], 'vp2_1');
  test.equal(o ['p2_2'], 'vp2_2');

  // should override object properties
  test.equal(o['o1_1'], 'vo1_1');
  test.equal(o['p2_2'], 'vp2_2');

  // should override values from previous arguments
  test.equal(o['override_1'], 'overridden');

  test.end();
});
