var util = require('vega-util'), vega = require('vega-dataflow'), tx = require('../'), changeset = vega.changeset, Collect = tx.collect, Fold = tx.fold;

test('Fold folds tuples', function() {
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
  expect(d.length).toBe(4);
  expect(d[0].key).toBe('b');expect(d[0].value).toBe(5);expect(d[0].a).toBe('!');
  expect(d[1].key).toBe('c');expect(d[1].value).toBe(7);expect(d[1].a).toBe('!');
  expect(d[2].key).toBe('b');expect(d[2].value).toBe(2);expect(d[2].a).toBe('?');
  expect(d[3].key).toBe('c');expect(d[3].value).toBe(4);expect(d[3].a).toBe('?');

  // -- process mods
  df.pulse(c0, changeset().modify(data[1], 'b', 9)).run();
  d = out.value;
  expect(d[2].key).toBe('b');expect(d[2].value).toBe(9);expect(d[2].a).toBe('?');

  // -- process rems
  df.pulse(c0, changeset().remove(data[0])).run();
  d = out.value;
  expect(d.length).toBe(2);
  expect(d[0].key).toBe('b');expect(d[0].value).toBe(9);expect(d[0].a).toBe('?');
  expect(d[1].key).toBe('c');expect(d[1].value).toBe(4);expect(d[1].a).toBe('?');
});
