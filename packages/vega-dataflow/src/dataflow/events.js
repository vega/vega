import {stream} from '../EventStream.js';
import {array} from 'vega-util';

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor. The input must
 *  support the addEventListener method.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @param {function(object): *} [apply] - Event application function.
 *   If provided, this function will be invoked and the result will be
 *   used as the downstream event value.
 * @return {EventStream}
 */
export default function(source, type, filter, apply) {
  const df = this,
        s = stream(filter, apply),
        send = function(e) {
          e.dataflow = df;
          try {
            s.receive(e);
          } catch (error) {
            df.error(error);
          } finally {
            df.run();
          }
        };

  let sources;
  if (typeof source === 'string' && typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  } else {
    sources = array(source);
  }

  const n = sources.length;
  for (let i = 0; i < n; ++i) {
    sources[i].addEventListener(type, send);
  }

  return s;
}
