import UniqueList from './util/UniqueList.js';
import {debounce, id, identity, truthy} from 'vega-util';

let STREAM_ID = 0;

/**
 * Models an event stream.
 * @constructor
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @param {function(Object)} [receive] - Event callback function to invoke
 *   upon receipt of a new event. Use to override standard event processing.
 */
export default function EventStream(filter, apply, receive) {
  this.id = ++STREAM_ID;
  this.value = null;
  if (receive) this.receive = receive;
  if (filter) this._filter = filter;
  if (apply) this._apply = apply;
}

/**
 * Creates a new event stream instance with the provided
 * (optional) filter, apply and receive functions.
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @see EventStream
 */
export function stream(filter, apply, receive) {
  return new EventStream(filter, apply, receive);
}

EventStream.prototype = {
  _filter: truthy,

  _apply: identity,

  targets() {
    return this._targets || (this._targets = UniqueList(id));
  },

  consume(_) {
    if (!arguments.length) return !!this._consume;
    this._consume = !!_;
    return this;
  },

  receive(evt) {
    if (this._filter(evt)) {
      const val = (this.value = this._apply(evt)),
          trg = this._targets,
          n = trg ? trg.length : 0;

      for (let i = 0; i < n; ++i) trg[i].receive(val);

      if (this._consume) {
        evt.preventDefault();
        evt.stopPropagation();
      }
    }
  },

  filter(filter) {
    const s = stream(filter);
    this.targets().add(s);
    return s;
  },

  apply(apply) {
    const s = stream(null, apply);
    this.targets().add(s);
    return s;
  },

  merge() {
    const s = stream();

    this.targets().add(s);
    for (let i=0, n=arguments.length; i<n; ++i) {
      arguments[i].targets().add(s);
    }

    return s;
  },

  throttle(pause) {
    let t = -1;
    return this.filter(() => {
      const now = Date.now();
      if ((now - t) > pause) {
        t = now;
        return 1;
      } else {
        return 0;
      }
    });
  },

  debounce(delay) {
    const s = stream();

    this.targets().add(stream(null, null,
      debounce(delay, e => {
        const df = e.dataflow;
        s.receive(e);
        if (df && df.run) df.run();
      })
    ));

    return s;
  },

  between(a, b) {
    let active = false;
    a.targets().add(stream(null, null, () => active = true));
    b.targets().add(stream(null, null, () => active = false));
    return this.filter(() => active);
  },

  detach() {
    // ensures compatibility with operators (#2753)
    // remove references to other streams and filter functions that may
    // be bound to subcontexts that need to be garbage collected.
    this._filter = truthy;
    this._targets = null;
  }
};
