import DataScope from './DataScope.js';

import {
  Compare, Expression, Field, Key, Projection, Proxy, Scale, Sieve
} from './transforms.js';

import {
  Ascending, Entry, aggrField, compareRef, fieldRef, isExpr,
  isSignal, keyRef, operator, ref
} from './util.js';

import parseScope from './parsers/scope.js';
import {parseExpression} from 'vega-functions';

import {
  array, error, extend, hasOwnProperty,
  isArray, isObject, isString, peek, stringValue
} from 'vega-util';

export default function Scope(config, options) {
  this.config = config || {};
  this.options = options || {};

  this.bindings = [];
  this.field = {};
  this.signals = {};
  this.lambdas = {};
  this.scales = {};
  this.events = {};
  this.data = {};

  this.streams = [];
  this.updates = [];
  this.operators = [];
  this.eventConfig = null;
  this.locale = null;

  this._id = 0;
  this._subid = 0;
  this._nextsub = [0];

  this._parent = [];
  this._encode = [];
  this._lookup = [];
  this._markpath = [];
}

function Subscope(scope) {
  this.config = scope.config;
  this.options = scope.options;
  this.legends = scope.legends;

  this.field = Object.create(scope.field);
  this.signals = Object.create(scope.signals);
  this.lambdas = Object.create(scope.lambdas);
  this.scales = Object.create(scope.scales);
  this.events = Object.create(scope.events);
  this.data = Object.create(scope.data);

  this.streams = [];
  this.updates = [];
  this.operators = [];

  this._id = 0;
  this._subid = ++scope._nextsub[0];
  this._nextsub = scope._nextsub;

  this._parent = scope._parent.slice();
  this._encode = scope._encode.slice();
  this._lookup = scope._lookup.slice();
  this._markpath = scope._markpath;
}

Scope.prototype = Subscope.prototype = {
  parse(spec) {
    return parseScope(spec, this);
  },

  fork() {
    return new Subscope(this);
  },

  isSubscope() {
    return this._subid > 0;
  },

  toRuntime() {
    this.finish();
    return {
      description: this.description,
      operators:   this.operators,
      streams:     this.streams,
      updates:     this.updates,
      bindings:    this.bindings,
      eventConfig: this.eventConfig,
      locale:      this.locale
    };
  },

  id() {
    return (this._subid ? this._subid + ':' : 0) + this._id++;
  },

  add(op) {
    this.operators.push(op);
    op.id = this.id();
    // if pre-registration references exist, resolve them now
    if (op.refs) {
      op.refs.forEach(ref => { ref.$ref = op.id; });
      op.refs = null;
    }
    return op;
  },

  proxy(op) {
    const vref = op instanceof Entry ? ref(op) : op;
    return this.add(Proxy({value: vref}));
  },

  addStream(stream) {
    this.streams.push(stream);
    stream.id = this.id();
    return stream;
  },

  addUpdate(update) {
    this.updates.push(update);
    return update;
  },

  // Apply metadata
  finish() {
    let name, ds;

    // annotate root
    if (this.root) this.root.root = true;

    // annotate signals
    for (name in this.signals) {
      this.signals[name].signal = name;
    }

    // annotate scales
    for (name in this.scales) {
      this.scales[name].scale = name;
    }

    // annotate data sets
    function annotate(op, name, type) {
      let data, list;
      if (op) {
        data = op.data || (op.data = {});
        list = data[name] || (data[name] = []);
        list.push(type);
      }
    }
    for (name in this.data) {
      ds = this.data[name];
      annotate(ds.input,  name, 'input');
      annotate(ds.output, name, 'output');
      annotate(ds.values, name, 'values');
      for (const field in ds.index) {
        annotate(ds.index[field], name, 'index:' + field);
      }
    }

    return this;
  },

  // ----

  pushState(encode, parent, lookup) {
    this._encode.push(ref(this.add(Sieve({pulse: encode}))));
    this._parent.push(parent);
    this._lookup.push(lookup ? ref(this.proxy(lookup)) : null);
    this._markpath.push(-1);
  },

  popState() {
    this._encode.pop();
    this._parent.pop();
    this._lookup.pop();
    this._markpath.pop();
  },

  parent() {
    return peek(this._parent);
  },

  encode() {
    return peek(this._encode);
  },

  lookup() {
    return peek(this._lookup);
  },

  markpath() {
    const p = this._markpath;
    return ++p[p.length-1];
  },

  // ----

  fieldRef(field, name) {
    if (isString(field)) return fieldRef(field, name);
    if (!field.signal) {
      error('Unsupported field reference: ' + stringValue(field));
    }

    const s = field.signal;
    let f = this.field[s];

    if (!f) {
      const params = {name: this.signalRef(s)};
      if (name) params.as = name;
      this.field[s] = f = ref(this.add(Field(params)));
    }
    return f;
  },

  compareRef(cmp) {
    let signal = false;

    const check = _ => isSignal(_)
      ? (signal = true, this.signalRef(_.signal))
      : isExpr(_) ? (signal = true, this.exprRef(_.expr))
      : _;

    const fields = array(cmp.field).map(check),
          orders = array(cmp.order).map(check);

    return signal
      ? ref(this.add(Compare({fields: fields, orders: orders})))
      : compareRef(fields, orders);
  },

  keyRef(fields, flat) {
    let signal = false;

    const check = _ => isSignal(_)
      ? (signal = true, ref(sig[_.signal]))
      : _;

    const sig = this.signals;
    fields = array(fields).map(check);

    return signal
      ? ref(this.add(Key({fields: fields, flat: flat})))
      : keyRef(fields, flat);
  },

  sortRef(sort) {
    if (!sort) return sort;

    // including id ensures stable sorting
    const a = aggrField(sort.op, sort.field),
         o = sort.order || Ascending;

    return o.signal
      ? ref(this.add(Compare({
          fields: a,
          orders: this.signalRef(o.signal)
        })))
      : compareRef(a, o);
  },

  // ----

  event(source, type) {
    const key = source + ':' + type;
    if (!this.events[key]) {
      const id = this.id();
      this.streams.push({
        id: id,
        source: source,
        type: type
      });
      this.events[key] = id;
    }
    return this.events[key];
  },

  // ----

  hasOwnSignal(name) {
    return hasOwnProperty(this.signals, name);
  },

  addSignal(name, value) {
    if (this.hasOwnSignal(name)) {
      error('Duplicate signal name: ' + stringValue(name));
    }
    const op = value instanceof Entry ? value : this.add(operator(value));
    return this.signals[name] = op;
  },

  getSignal(name) {
    if (!this.signals[name]) {
      error('Unrecognized signal name: ' + stringValue(name));
    }
    return this.signals[name];
  },

  signalRef(s) {
    if (this.signals[s]) {
      return ref(this.signals[s]);
    } else if (!hasOwnProperty(this.lambdas, s)) {
      this.lambdas[s] = this.add(operator(null));
    }
    return ref(this.lambdas[s]);
  },

  parseLambdas() {
    const code = Object.keys(this.lambdas);
    for (let i=0, n=code.length; i<n; ++i) {
      const s = code[i],
            e = parseExpression(s, this),
            op = this.lambdas[s];
      op.params = e.$params;
      op.update = e.$expr;
    }
  },

  property(spec) {
    return spec && spec.signal ? this.signalRef(spec.signal) : spec;
  },

  objectProperty(spec) {
    return (!spec || !isObject(spec)) ? spec
      : this.signalRef(spec.signal || propertyLambda(spec));
  },

  exprRef(code, name) {
    const params = {expr: parseExpression(code, this)};
    if (name) params.expr.$name = name;
    return ref(this.add(Expression(params)));
  },

  addBinding(name, bind) {
    if (!this.bindings) {
      error('Nested signals do not support binding: ' + stringValue(name));
    }
    this.bindings.push(extend({signal: name}, bind));
  },

  // ----

  addScaleProj(name, transform) {
    if (hasOwnProperty(this.scales, name)) {
      error('Duplicate scale or projection name: ' + stringValue(name));
    }
    this.scales[name] = this.add(transform);
  },

  addScale(name, params) {
    this.addScaleProj(name, Scale(params));
  },

  addProjection(name, params) {
    this.addScaleProj(name, Projection(params));
  },

  getScale(name) {
    if (!this.scales[name]) {
      error('Unrecognized scale name: ' + stringValue(name));
    }
    return this.scales[name];
  },

  scaleRef(name) {
    return ref(this.getScale(name));
  },

  scaleType(name) {
    return this.getScale(name).params.type;
  },

  projectionRef(name) {
    return this.scaleRef(name);
  },

  projectionType(name) {
    return this.scaleType(name);
  },

  // ----

  addData(name, dataScope) {
    if (hasOwnProperty(this.data, name)) {
      error('Duplicate data set name: ' + stringValue(name));
    }
    return (this.data[name] = dataScope);
  },

  getData(name) {
    if (!this.data[name]) {
      error('Undefined data set name: ' + stringValue(name));
    }
    return this.data[name];
  },

  addDataPipeline(name, entries) {
    if (hasOwnProperty(this.data, name)) {
      error('Duplicate data set name: ' + stringValue(name));
    }
    return this.addData(name, DataScope.fromEntries(this, entries));
  }
};

function propertyLambda(spec) {
  return (isArray(spec) ? arrayLambda : objectLambda)(spec);
}

function arrayLambda(array) {
  const n = array.length;
  let code = '[';

  for (let i = 0; i<n; ++i) {
    const value = array[i];
    code += (i > 0 ? ',' : '')
      + (isObject(value)
        ? (value.signal || propertyLambda(value))
        : stringValue(value));
  }
  return code + ']';
}

function objectLambda(obj) {
  let code = '{',
      i = 0,
      key, value;

  for (key in obj) {
    value = obj[key];
    code += (++i > 1 ? ',' : '')
      + stringValue(key) + ':'
      + (isObject(value)
        ? (value.signal || propertyLambda(value))
        : stringValue(value));
  }
  return code + '}';
}
