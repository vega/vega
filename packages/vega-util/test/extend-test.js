var vega = require('../');

test('extend extends objects with other object properties', function() {
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
    expect(o['o1_1']).toBe('vo1_1');
    expect(o['o1_2']).toBe('vo1_2');
    expect(o['o2_1']).toBe('vo2_1');

    // should inherit all parent properties
    expect(o['p1_1']).toBe('vp1_1');
    expect(o['p2_1']).toBe('vp2_1');
    expect(o ['p2_2']).toBe('vp2_2');

    // should override object properties
    expect(o['o1_1']).toBe('vo1_1');
    expect(o['p2_2']).toBe('vp2_2');

    // should override values from previous arguments
    expect(o['override_1']).toBe('overridden');
});
