var b = require('./index'),
    t = b.tasks,
    s1 = b.specs.vg1,
    s2  = b.specs.vg2;

// vg2.config.debug = true;

b.run('bar', 1000, [t.vg1.bind(null, s1.bar), t.vg2.bind(null, s2.bar)])
  .then(function() {
    return b.run('bar', 10000, [t.vg1.bind(null, s1.bar), t.vg2.bind(null, s2.bar)]);
  })
  .then(function() {
    return b.run('bar', 100000, [t.vg1.bind(null, s1.bar), t.vg2.bind(null, s2.bar)]);
  })
  .then(function() {
    return b.run('pcp', 1000, [t.vg1.bind(null, s1.pcp), t.vg2.bind(null, s2.pcp)]);
  })
  .then(function() {
    return b.run('pcp', 10000, [t.vg1.bind(null, s1.pcp), t.vg2.bind(null, s2.pcp)]);
  })
  .then(function() {
    return b.run('pcp', 100000, [t.vg1.bind(null, s1.pcp), t.vg2.bind(null, s2.pcp)]);
  })