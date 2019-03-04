var util = require('vega-util'), vega = require('vega-dataflow'), Collect = require('../').collect, changeset = vega.changeset;

test('Collect collects tuples', function() {
  var data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  var df = new vega.Dataflow(),
      so = df.add(null),
      c0 = df.add(Collect, {sort:so});

  df.run(); // initialize
  expect(c0.value.length).toBe(0);
  expect(!!c0.modified()).toBe(false);

  // add data
  df.pulse(c0, changeset().insert(data)).run();
  expect(c0.value.length).toBe(3);
  expect(c0.value[0]).toBe(data[0]);
  expect(c0.value[1]).toBe(data[1]);
  expect(c0.value[2]).toBe(data[2]);
  expect(!!c0.modified()).toBe(true);

  // sort data
  df.update(so, util.compare('value')).run();
  expect(c0.value.length).toBe(3);
  expect(c0.value[0]).toBe(data[1]);
  expect(c0.value[1]).toBe(data[2]);
  expect(c0.value[2]).toBe(data[0]);
  expect(!!c0.modified()).toBe(true);

  // add new data
  data.push({id:2, value:'abc'});
  df.pulse(c0, changeset().insert(data[3])).run();
  expect(c0.value.length).toBe(4);
  expect(c0.value[0]).toBe(data[3]);
  expect(c0.value[1]).toBe(data[1]);
  expect(c0.value[2]).toBe(data[2]);
  expect(c0.value[3]).toBe(data[0]);
  expect(!!c0.modified()).toBe(true);

  // remove data
  df.pulse(c0, changeset().remove(data[1])).run();
  expect(c0.value.length).toBe(3);
  expect(c0.value[0]).toBe(data[3]);
  expect(c0.value[1]).toBe(data[2]);
  expect(c0.value[2]).toBe(data[0]);
  expect(!!c0.modified()).toBe(true);

  // modify data
  df.pulse(c0, changeset().modify(data[0], 'value', 'boo')).run();
  expect(c0.value.length).toBe(3);
  expect(c0.value[0]).toBe(data[3]);
  expect(c0.value[1]).toBe(data[2]);
  expect(c0.value[2]).toBe(data[0]);
  expect(!!c0.modified()).toBe(true);

  // do nothing
  df.touch(c0).run();
  expect(c0.value.length).toBe(3);
  expect(!!c0.modified()).toBe(false);
});
