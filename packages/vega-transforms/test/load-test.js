var tape = require('tape'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    Load = tx.load;

tape('Load requests external data', function(test) {
  var df = new vega.Dataflow(),
      u = df.add('url'),
      f = df.add('format'),
      l = df.add(Load, {url:u, format:f}),
      t = l.target = 'target',
      count = 0;

  df.request = function(target, url, format) {
    test.equal(target, t);
    test.equal(url, u.value);
    test.equal(format, f.value);
    count += 1;
  };

  // load should invoke request with provided parameters
  df.run();
  test.equal(count, 1);

  // load should re-invoke request if parameters change
  df.update(u, 'foo').update(f, 'bar').run();
  test.equal(count, 2);

  test.end();
});
