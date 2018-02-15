var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    changeset = vega.changeset,
    Collect = tx.collect,
    Fold = tx.fold;

tape('Fold folds tuples', function(test) {
  var data = [
    {a:'!', b:5, c:7},
    {a:'?', b:2, c:4}
  ];

  var fields = ['b', 'c'].map(function(k) { return util.field(k); }),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      fd = df.add(Fold, {fields: fields, pulse: c0}),
      out = df.add(Collect, {pulse: fd}),
      d;

  // -- process adds
  df.pulse(c0, changeset().insert(data)).run();
  d = out.value;
  test.equal(d.length, 4);
  test.equal(d[0].key, 'b'); test.equal(d[0].value, 5); test.equal(d[0].a, '!');
  test.equal(d[1].key, 'c'); test.equal(d[1].value, 7); test.equal(d[1].a, '!');
  test.equal(d[2].key, 'b'); test.equal(d[2].value, 2); test.equal(d[2].a, '?');
  test.equal(d[3].key, 'c'); test.equal(d[3].value, 4); test.equal(d[3].a, '?');

  // -- process mods
  df.pulse(c0, changeset().modify(data[1], 'b', 9)).run();
  d = out.value;
  test.equal(d[2].key, 'b'); test.equal(d[2].value, 9); test.equal(d[2].a, '?');

  // -- process rems
  df.pulse(c0, changeset().remove(data[0])).run();
  d = out.value;
  test.equal(d.length, 2);
  test.equal(d[0].key, 'b'); test.equal(d[0].value, 9); test.equal(d[0].a, '?');
  test.equal(d[1].key, 'c'); test.equal(d[1].value, 4); test.equal(d[1].a, '?');

  test.end();
});
