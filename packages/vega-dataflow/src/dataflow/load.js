import {load, read} from 'vega-loader';

export function ingest(target, data, format) {
  return this.pulse(target, this.changeset().insert(read(data, format)));
}

export function loadOptions(_) {
  return arguments.length ? (this._loadopt = _, this) : this._loadopt;
}

function loadPending(df) {
  var pending = new Promise(function(accept) { resolve = accept; }),
      resolve;

  pending.requests = 0;

  pending.done = function() {
    if (--pending.requests === 0) {
      df.runAfter(function() {
        df._pending = null;
        df.run();
        resolve(df);
      });
    }
  }

  return (df._pending = pending);
}

export function request(target, url, format) {
  var df = this,
      pending = df._pending || loadPending(df);

  pending.requests += 1;

  load(url, df.loadOptions())
    .then(
      function(data) {
        df.ingest(target, data, format);
      },
      function(error) {
        df.warn('Loading failed: ' + url, error);
        pending.done();
      })
    .then(pending.done)
    .catch(function(error) {
      df.error(error);
    });
}
