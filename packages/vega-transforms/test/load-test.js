var tape = require('tape'),
    vega = require('vega-dataflow'),
    tx = require('../'),
    Load = tx.load;

tape('Load requests external data', function(test) {
  var df = new vega.Dataflow(),
      u = df.add('url'),
      f = df.add('format'),
      count = 0;

  df.add(Load, {url:u, format:f});

  df.request = async function(url, format) {
    test.equal(url, u.value);
    test.equal(format, f.value);
    return {
      data: [++count],
      status: 0
    };
  };

  // load should invoke request with provided parameters
  df.runAsync()
    .then(() => {
      test.equal(count, 1);
      // load should re-invoke request if parameters change
      return df.update(u, 'foo').update(f, 'bar').runAsync();
    })
    .then(() => {
      test.equal(count, 2);
      test.end();
    });
});
