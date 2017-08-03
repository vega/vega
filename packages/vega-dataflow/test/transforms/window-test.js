var tape = require('tape'),
    util = require('vega-util'),
    vega = require('../../'),
    changeset = vega.changeset,
    tx = vega.transforms;

function match(test, actual, expect) {
  for (var k in expect) {
    test.equal(actual[k], expect[k]);
  }
}

tape('Window processes single partition', function(test) {
  var data = [
    {k:'a', v:1, key:0},
    {k:'b', v:3, key:1},
    {k:'a', v:2, key:2},
    {k:'b', v:4, key:2},
    {k:'a', v:3, key:3}
  ];

  var val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(tx.Collect),
      agg = df.add(tx.Window, {
        sort: util.compare('key'),
        frame: [null, 0],
        ignorePeers: true,
        fields: [
          null, val, val, val,
          null, null, null, null,
          null, null, val, val,
          val, val, val
        ],
        ops: [
          'count', 'sum', 'min', 'max',
          'row_number', 'rank', 'dense_rank', 'percent_rank',
          'cume_dist', 'ntile', 'lag', 'lead',
          'first_value', 'last_value', 'nth_value'
        ],
        params: [
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 2, 1, 1,
          0, 0, 2
        ],
        pulse: col
      }),
      out = df.add(tx.Collect, {pulse: agg});

  // -- test add
  df.pulse(col, changeset().insert(data)).run();
  var d = out.value;
  test.equal(d.length, data.length);
  match(test, d[0], {
    k: 'a', v: 1, key: 0,
    count: 1, sum_v: 1, min_v: 1, max_v: 1,
    row_number: 1, rank: 1, dense_rank: 1, percent_rank: 0,
    cume_dist: 0.2, ntile: 1, lag_v: null, lead_v: 3,
    first_value_v: 1, last_value_v: 1, nth_value_v: null
  });
  match(test, d[1], {
    k: 'b', v: 3, key: 1,
    count: 2, sum_v: 4, min_v: 1, max_v: 3,
    row_number: 2, rank: 2, dense_rank: 2, percent_rank: 0.25,
    cume_dist: 0.4, ntile: 1, lag_v: 1, lead_v: 2,
    first_value_v: 1, last_value_v: 3, nth_value_v: 3
  });
  match(test, d[2], {
    k: 'a', v: 2, key: 2,
    count: 3, sum_v: 6, min_v: 1, max_v: 3,
    row_number: 3, rank: 3, dense_rank: 3, percent_rank: 0.5,
    cume_dist: 0.8, ntile: 2, lag_v: 3, lead_v: 4,
    first_value_v: 1, last_value_v: 2, nth_value_v: 3
  });
  match(test, d[3], {
    k: 'b', v: 4, key: 2,
    count: 4, sum_v: 10, min_v: 1, max_v: 4,
    row_number: 4, rank: 3, dense_rank: 3, percent_rank: 0.5,
    cume_dist: 0.8, ntile: 2, lag_v: 2, lead_v: 3,
    first_value_v: 1, last_value_v: 4, nth_value_v: 3
  });
  match(test, d[4], {
    k: 'a', v: 3, key: 3,
    count: 5, sum_v: 13, min_v: 1, max_v: 4,
    row_number: 5, rank: 5, dense_rank: 4, percent_rank: 1,
    cume_dist: 1, ntile: 2, lag_v: 4, lead_v: null,
    first_value_v: 1, last_value_v: 3, nth_value_v: 3
  });

  // -- test rem
  df.pulse(col, changeset().remove([data[1], data[3]])).run();
  d = out.value;
  test.equal(d.length, data.length - 2);
  match(test, d[0], {
    k: 'a', v: 1, key: 0,
    count: 1, sum_v: 1, min_v: 1, max_v: 1,
    row_number: 1, rank: 1, dense_rank: 1, percent_rank: 0,
    cume_dist: 1/3, ntile: 1, lag_v: null, lead_v: 2,
    first_value_v: 1, last_value_v: 1, nth_value_v: null
  });
  match(test, d[1], {
    k: 'a', v: 2, key: 2,
    count: 2, sum_v: 3, min_v: 1, max_v: 2,
    row_number: 2, rank: 2, dense_rank: 2, percent_rank: 0.5,
    cume_dist: 2/3, ntile: 2, lag_v: 1, lead_v: 3,
    first_value_v: 1, last_value_v: 2, nth_value_v: 2
  });
  match(test, d[2], {
    k: 'a', v: 3, key: 3,
    count: 3, sum_v: 6, min_v: 1, max_v: 3,
    row_number: 3, rank: 3, dense_rank: 3, percent_rank: 1,
    cume_dist: 1, ntile: 2, lag_v: 2, lead_v: null,
    first_value_v: 1, last_value_v: 3, nth_value_v: 2
  });

  test.end();
});

tape('Window processes multiple partitions', function(test) {
  var data = [
    {k:'a', v:1, key:0},
    {k:'b', v:3, key:1},
    {k:'a', v:2, key:2},
    {k:'b', v:4, key:2},
    {k:'a', v:3, key:3}
  ];

  var val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(tx.Collect),
      agg = df.add(tx.Window, {
        sort: util.compare('key'),
        groupby: [util.field('k')],
        frame: [null, 0],
        ignorePeers: true,
        fields: [
          null, val, val, val,
          null, null, null, null,
          null, null, val, val,
          val, val, val
        ],
        ops: [
          'count', 'sum', 'min', 'max',
          'row_number', 'rank', 'dense_rank', 'percent_rank',
          'cume_dist', 'ntile', 'lag', 'lead',
          'first_value', 'last_value', 'nth_value'
        ],
        params: [
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 2, 1, 1,
          0, 0, 2
        ],
        pulse: col
      }),
      out = df.add(tx.Collect, {pulse: agg});

  // -- test add
  df.pulse(col, changeset().insert(data)).run();
  var d = out.value.sort(util.compare('k', 'key'));
  test.equal(d.length, data.length);
  match(test, d[0], {
    k: 'a', v: 1, key: 0,
    count: 1, sum_v: 1, min_v: 1, max_v: 1,
    row_number: 1, rank: 1, dense_rank: 1, percent_rank: 0,
    cume_dist: 1/3, ntile: 1, lag_v: null, lead_v: 2,
    first_value_v: 1, last_value_v: 1, nth_value_v: null
  });
  match(test, d[1], {
    k: 'a', v: 2, key: 2,
    count: 2, sum_v: 3, min_v: 1, max_v: 2,
    row_number: 2, rank: 2, dense_rank: 2, percent_rank: 0.5,
    cume_dist: 2/3, ntile: 2, lag_v: 1, lead_v: 3,
    first_value_v: 1, last_value_v: 2, nth_value_v: 2
  });
  match(test, d[2], {
    k: 'a', v: 3, key: 3,
    count: 3, sum_v: 6, min_v: 1, max_v: 3,
    row_number: 3, rank: 3, dense_rank: 3, percent_rank: 1,
    cume_dist: 1, ntile: 2, lag_v: 2, lead_v: null,
    first_value_v: 1, last_value_v: 3, nth_value_v: 2
  });
  match(test, d[3], {
    k: 'b', v: 3, key: 1,
    count: 1, sum_v: 3, min_v: 3, max_v: 3,
    row_number: 1, rank: 1, dense_rank: 1, percent_rank: 0,
    cume_dist: 0.5, ntile: 1, lag_v: null, lead_v: 4,
    first_value_v: 3, last_value_v: 3, nth_value_v: null
  });
  match(test, d[4], {
    k: 'b', v: 4, key: 2,
    count: 2, sum_v: 7, min_v: 3, max_v: 4,
    row_number: 2, rank: 2, dense_rank: 2, percent_rank: 1,
    cume_dist: 1, ntile: 2, lag_v: 3, lead_v: null,
    first_value_v: 3, last_value_v: 4, nth_value_v: 4
  });

  test.end();
});

tape('Window processes range frames', function(test) {
  var data = [
    {k:'a', v:1, key:0},
    {k:'b', v:3, key:1},
    {k:'a', v:2, key:2},
    {k:'b', v:4, key:2},
    {k:'a', v:3, key:3}
  ];

  var val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(tx.Collect),
      agg = df.add(tx.Window, {
        sort: util.compare('key'),
        frame: [0, null],
        ignorePeers: false,
        fields: [null, val, val, val, val, val],
        ops: ['count', 'sum', 'min', 'max', 'first_value', 'last_value'],
        pulse: col
      }),
      out = df.add(tx.Collect, {pulse: agg});

  // -- test add
  df.pulse(col, changeset().insert(data)).run();
  var d = out.value;
  test.equal(d.length, data.length);
  match(test, d[0], {
    k: 'a', v: 1, key: 0,
    count: 5, sum_v: 13, min_v: 1, max_v: 4,
    first_value_v: 1, last_value_v: 3
  });
  match(test, d[1], {
    k: 'b', v: 3, key: 1,
    count: 4, sum_v: 12, min_v: 2, max_v: 4,
    first_value_v: 3, last_value_v: 3
  });
  match(test, d[2], {
    k: 'a', v: 2, key: 2,
    count: 3, sum_v: 9, min_v: 2, max_v: 4,
    first_value_v: 2, last_value_v: 3
  });
  match(test, d[3], {
    k: 'b', v: 4, key: 2,
    count: 3, sum_v: 9, min_v: 2, max_v: 4,
    first_value_v: 2, last_value_v: 3
  });
  match(test, d[4], {
    k: 'a', v: 3, key: 3,
    count: 1, sum_v: 3, min_v: 3, max_v: 3,
    first_value_v: 3, last_value_v: 3
  });

  // -- test mod
  df.pulse(col, changeset().modify(data[3], 'key', 4)).run();
  d = out.value;
  test.equal(d.length, data.length);
  match(test, d[0], {
    k: 'a', v: 1, key: 0,
    count: 5, sum_v: 13, min_v: 1, max_v: 4,
    first_value_v: 1, last_value_v: 4
  });
  match(test, d[1], {
    k: 'b', v: 3, key: 1,
    count: 4, sum_v: 12, min_v: 2, max_v: 4,
    first_value_v: 3, last_value_v: 4
  });
  match(test, d[2], {
    k: 'a', v: 2, key: 2,
    count: 3, sum_v: 9, min_v: 2, max_v: 4,
    first_value_v: 2, last_value_v: 4
  });
  match(test, d[3], {
    k: 'b', v: 4, key: 4,
    count: 1, sum_v: 4, min_v: 4, max_v: 4,
    first_value_v: 4, last_value_v: 4
  });
  match(test, d[4], {
    k: 'a', v: 3, key: 3,
    count: 2, sum_v: 7, min_v: 3, max_v: 4,
    first_value_v: 3, last_value_v: 4
  });

  test.end();
});

tape('Window processes row frames', function(test) {
  var data = [
    {k:'a', v:1, key:0},
    {k:'b', v:3, key:1},
    {k:'a', v:2, key:2},
    {k:'b', v:4, key:2},
    {k:'a', v:3, key:3}
  ];

  var val = util.field('v'),
      df = new vega.Dataflow(),
      col = df.add(tx.Collect),
      agg = df.add(tx.Window, {
        sort: util.compare('key'),
        frame: [-1, 1],
        ignorePeers: true,
        fields: [null, val, val, null],
        ops: ['count', 'sum', 'mean', 'rank'],
        pulse: col
      }),
      out = df.add(tx.Collect, {pulse: agg});

  // -- test add
  df.pulse(col, changeset().insert(data)).run();
  var d = out.value;
  test.equal(d.length, data.length);
  match(test, d[0], {
    k: 'a', v: 1, key: 0,
    count: 2, sum_v: 4, mean_v: 2, rank: 1
  });
  match(test, d[1], {
    k: 'b', v: 3, key: 1,
    count: 3, sum_v: 6, mean_v: 2, rank: 2
  });
  match(test, d[2], {
    k: 'a', v: 2, key: 2,
    count: 3, sum_v: 9, mean_v: 3, rank: 3
  });
  match(test, d[3], {
    k: 'b', v: 4, key: 2,
    count: 3, sum_v: 9, mean_v: 3, rank: 3
  });
  match(test, d[4], {
    k: 'a', v: 3, key: 3,
    count: 2, sum_v: 7, mean_v: 3.5, rank: 5
  });

  test.end();
});

tape('Window processes unsorted values', function(test) {
  var data = [
    {key:0}, {key:1}, {key:2}, {key:3}, {key:4}
  ];

  var df = new vega.Dataflow(),
      col = df.add(tx.Collect),
      agg = df.add(tx.Window, {
        ops: ['rank', 'dense_rank'],
        pulse: col
      }),
      out = df.add(tx.Collect, {pulse: agg});

  df.pulse(col, changeset().insert(data)).run();
  var d = out.value;
  test.equal(d.length, data.length);
  match(test, d[0], {key: 0, rank: 1, dense_rank: 1});
  match(test, d[1], {key: 1, rank: 2, dense_rank: 2});
  match(test, d[2], {key: 2, rank: 3, dense_rank: 3});
  match(test, d[3], {key: 3, rank: 4, dense_rank: 4});
  match(test, d[4], {key: 4, rank: 5, dense_rank: 5});

  test.end();
});
