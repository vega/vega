import {read} from 'vega-loader';
import {truthy} from 'vega-util';

/**
 * Ingests new data into the dataflow. First parses the data using the
 * vega-loader read method, then pulses a changeset to the target operator.
 * @param {Operator} target - The Operator to target with ingested data,
 *   typically a Collect transform instance.
 * @param {*} data - The input data, prior to parsing. For JSON this may
 *   be a string or an object. For CSV, TSV, etc should be a string.
 * @param {object} format - The data format description for parsing
 *   loaded data. This object is passed to the vega-loader read method.
 * @returns {Dataflow}
 */
export function ingest(target, data, format) {
  return this.pulse(target, this.changeset().insert(read(data, format)));
}

function loadPending(df) {
  var accept, reject,
      pending = new Promise(function(a, r) {
        accept = function() { a(df); };
        reject = r;
      });

  pending.requests = 0;

  pending.done = function() {
    if (--pending.requests === 0) {
      df.runAfter(function() {
        df._pending = null;
        try {
          df.run();
          if (df._pending) {
            df._pending.then(accept);
          } else {
            accept();
          }
        } catch (err) {
          reject(err);
        }
      });
    }
  };

  return (df._pending = pending);
}

/**
 * Request data from an external source, parse it, and pulse a changeset
 * to the specified target operator.
 * @param {Operator} target - The Operator to target with the loaded data,
 *   typically a Collect transform instance.
 * @param {string} url - The URL from which to load the data. This string
 *   is passed to the vega-loader load method.
 * @param {object} [format] - The data format description for parsing
 *   loaded data. This object is passed to the vega-loader read method.
 * @return {Promise} A Promise that resolves upon completion of the request.
 *   Resolves to a status code: 0 success, -1 load fail, -2 parse fail.
 */
export function request(target, url, format) {
  var df = this,
      status = 0,
      pending = df._pending || loadPending(df);

  pending.requests += 1;

  return df.loader()
    .load(url, {context:'dataflow'})
    .then(
      function(data) {
        return read(data, format);
      },
      function(error) {
        status = -1;
        df.error('Loading failed', url, error);
      })
    .catch(
      function(error) {
        status = -2;
        df.error('Data ingestion failed', url, error);
      })
    .then(function(data) {
      df.pulse(target, df.changeset().remove(truthy).insert(data || []));
      pending.done();
      return status;
    });
}
