var tape = require('tape');
var util = require('vega-util');
var vega = require('vega-dataflow');
var tx = require('../');
var changeset = vega.changeset;
var Collect = tx.collect;
var Fold = tx.fold;

tape('Fold folds tuples', t => {
  const data = [
    {a:'!', b:5, c:7},
    {a:'?', b:2, c:4}
  ];

  var fields = ['b', 'c'].map(k => util.field(k));
  var df = new vega.Dataflow();
  var c0 = df.add(Collect);
  var fd = df.add(Fold, {fields: fields, pulse: c0});
  var out = df.add(Collect, {pulse: fd});
  var d;

  // -- process adds
  df.pulse(c0, changeset().insert(data)).run();
  d = out.value;
  t.equal(d.length, 4);
  t.equal(d[0].key, 'b');t.equal(d[0].value, 5);t.equal(d[0].a, '!');
  t.equal(d[1].key, 'c');t.equal(d[1].value, 7);t.equal(d[1].a, '!');
  t.equal(d[2].key, 'b');t.equal(d[2].value, 2);t.equal(d[2].a, '?');
  t.equal(d[3].key, 'c');t.equal(d[3].value, 4);t.equal(d[3].a, '?');

  // -- process mods
  df.pulse(c0, changeset().modify(data[1], 'b', 9)).run();
  d = out.value;
  t.equal(d[2].key, 'b');t.equal(d[2].value, 9);t.equal(d[2].a, '?');

  // -- process rems
  df.pulse(c0, changeset().remove(data[0])).run();
  d = out.value;
  t.equal(d.length, 2);
  t.equal(d[0].key, 'b');t.equal(d[0].value, 9);t.equal(d[0].a, '?');
  t.equal(d[1].key, 'c');t.equal(d[1].value, 4);t.equal(d[1].a, '?');

  t.end();
});
