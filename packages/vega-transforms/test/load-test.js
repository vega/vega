var vega = require('vega-dataflow'), tx = require('../'), Load = tx.load;

test('Load requests external data', function(done) {
  var df = new vega.Dataflow(),
      u = df.add('url'),
      f = df.add('format'),
      count = 0;

  df.add(Load, {url:u, format:f});

  df.request = async function(url, format) {
    expect(url).toBe(u.value);
    expect(format).toBe(f.value);
    return {
      data: [++count],
      status: 0
    };
  };

  // load should invoke request with provided parameters
  df.runAsync()
    .then(() => {
      expect(count).toBe(1);
      // load should re-invoke request if parameters change
      return df.update(u, 'foo').update(f, 'bar').runAsync();
    })
    .then(() => {
      expect(count).toBe(2);
      done();
    });
});
