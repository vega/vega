import tape from 'tape';
import {Dataflow} from 'vega-dataflow';
import {load as Load} from '../index.js';

tape('Load requests external data', t => {
  var df = new Dataflow(),
      u = df.add('url'),
      f = df.add('format'),
      count = 0;

  df.add(Load, {url:u, format:f});

  df.request = async function(url, format) {
    t.equal(url, u.value);
    t.equal(format, f.value);
    return {
      data: [++count],
      status: 0
    };
  };

  // load should invoke request with provided parameters
  df.runAsync()
    .then(() => {
      t.equal(count, 1);
      // load should re-invoke request if parameters change
      return df.update(u, 'foo').update(f, 'bar').runAsync();
    })
    .then(() => {
      t.equal(count, 2);
      t.end();
    });
});
