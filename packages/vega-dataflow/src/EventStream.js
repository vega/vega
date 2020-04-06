import UniqueList from './util/UniqueList';
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

const prototype = EventStream.prototype;

prototype._filter = truthy;

prototype._apply = identity;

prototype.targets = function () {
  return this._targets || (this._targets = UniqueList(id));
};

prototype.consume = function (_) {
  if (!arguments.length) return !!this._consume;
  this._consume = !!_;
  return this;
};

prototype.receive = function (evt) {
  if (this._filter(evt)) {
    const val = (this.value = this._apply(evt));
    const trg = this._targets;
    const n = trg ? trg.length : 0;
    let i = 0;

    for (; i < n; ++i) trg[i].receive(val);

    if (this._consume) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  }
};

prototype.filter = function (filter) {
  const s = stream(filter);
  this.targets().add(s);
  return s;
};

prototype.apply = function (apply) {
  const s = stream(null, apply);
  this.targets().add(s);
  return s;
};

prototype.merge = function (...args) {
  const s = stream();

  this.targets().add(s);
  for (let i = 0, n = args.length; i < n; ++i) {
    args[i].targets().add(s);
  }

  return s;
};

prototype.throttle = function (pause) {
  let t = -1;
  return this.filter(function () {
    const now = Date.now();
    if (now - t > pause) {
      t = now;
      return 1;
    } else {
      return 0;
    }
  });
};

prototype.debounce = function (delay) {
  const s = stream();

  this.targets().add(
    stream(
      null,
      null,
      debounce(delay, function (e) {
        const df = e.dataflow;
        s.receive(e);
        if (df && df.run) df.run();
      })
    )
  );

  return s;
};

prototype.between = function (a, b) {
  let active = false;
  a.targets().add(
    stream(null, null, function () {
      active = true;
    })
  );
  b.targets().add(
    stream(null, null, function () {
      active = false;
    })
  );
  return this.filter(function () {
    return active;
  });
};
