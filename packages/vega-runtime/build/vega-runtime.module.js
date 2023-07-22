import { toSet, stringValue, error, isArray, isObject, hasOwnProperty, accessor, key, field, array, compare, truthy } from 'vega-util';
import { tupleid } from 'vega-dataflow';

/**
 * Parse a serialized dataflow specification.
 */
function parse (spec) {
  const ctx = this,
    operators = spec.operators || [];

  // parse background
  if (spec.background) {
    ctx.background = spec.background;
  }

  // parse event configuration
  if (spec.eventConfig) {
    ctx.eventConfig = spec.eventConfig;
  }

  // parse locale configuration
  if (spec.locale) {
    ctx.locale = spec.locale;
  }

  // parse operators
  operators.forEach(entry => ctx.parseOperator(entry));

  // parse operator parameters
  operators.forEach(entry => ctx.parseOperatorParameters(entry));

  // parse streams
  (spec.streams || []).forEach(entry => ctx.parseStream(entry));

  // parse updates
  (spec.updates || []).forEach(entry => ctx.parseUpdate(entry));
  return ctx.resolve();
}

const Skip = toSet(['rule']),
  Swap = toSet(['group', 'image', 'rect']);
function adjustSpatial(encode, marktype) {
  let code = '';
  if (Skip[marktype]) return code;
  if (encode.x2) {
    if (encode.x) {
      if (Swap[marktype]) {
        code += 'if(o.x>o.x2)$=o.x,o.x=o.x2,o.x2=$;';
      }
      code += 'o.width=o.x2-o.x;';
    } else {
      code += 'o.x=o.x2-(o.width||0);';
    }
  }
  if (encode.xc) {
    code += 'o.x=o.xc-(o.width||0)/2;';
  }
  if (encode.y2) {
    if (encode.y) {
      if (Swap[marktype]) {
        code += 'if(o.y>o.y2)$=o.y,o.y=o.y2,o.y2=$;';
      }
      code += 'o.height=o.y2-o.y;';
    } else {
      code += 'o.y=o.y2-(o.height||0);';
    }
  }
  if (encode.yc) {
    code += 'o.y=o.yc-(o.height||0)/2;';
  }
  return code;
}
function canonicalType(type) {
  return (type + '').toLowerCase();
}
function isOperator(type) {
  return canonicalType(type) === 'operator';
}
function isCollect(type) {
  return canonicalType(type) === 'collect';
}

function expression(ctx, args, code) {
  // wrap code in return statement if expression does not terminate
  if (!code.endsWith(';')) {
    code = 'return(' + code + ');';
  }
  const fn = Function(...args.concat(code));
  return ctx && ctx.functions ? fn.bind(ctx.functions) : fn;
}

// generate code for comparing a single field
function _compare(u, v, lt, gt) {
  return `((u = ${u}) < (v = ${v}) || u == null) && v != null ? ${lt}
  : (u > v || v == null) && u != null ? ${gt}
  : ((v = v instanceof Date ? +v : v), (u = u instanceof Date ? +u : u)) !== u && v === v ? ${lt}
  : v !== v && u === u ? ${gt} : `;
}
var expressionCodegen = {
  /**
   * Parse an expression used to update an operator value.
   */
  operator: (ctx, expr) => expression(ctx, ['_'], expr.code),
  /**
   * Parse an expression provided as an operator parameter value.
   */
  parameter: (ctx, expr) => expression(ctx, ['datum', '_'], expr.code),
  /**
   * Parse an expression applied to an event stream.
   */
  event: (ctx, expr) => expression(ctx, ['event'], expr.code),
  /**
   * Parse an expression used to handle an event-driven operator update.
   */
  handler: (ctx, expr) => {
    const code = `var datum=event.item&&event.item.datum;return ${expr.code};`;
    return expression(ctx, ['_', 'event'], code);
  },
  /**
   * Parse an expression that performs visual encoding.
   */
  encode: (ctx, encode) => {
    const {
      marktype,
      channels
    } = encode;
    let code = 'var o=item,datum=o.datum,m=0,$;';
    for (const name in channels) {
      const o = 'o[' + stringValue(name) + ']';
      code += `$=${channels[name].code};if(${o}!==$)${o}=$,m=1;`;
    }
    code += adjustSpatial(channels, marktype);
    code += 'return m;';
    return expression(ctx, ['item', '_'], code);
  },
  /**
   * Optimized code generators for access and comparison.
   */
  codegen: {
    get(path) {
      const ref = `[${path.map(stringValue).join('][')}]`;
      const get = Function('_', `return _${ref};`);
      get.path = ref;
      return get;
    },
    comparator(fields, orders) {
      let t;
      const map = (f, i) => {
        const o = orders[i];
        let u, v;
        if (f.path) {
          u = `a${f.path}`;
          v = `b${f.path}`;
        } else {
          (t = t || {})['f' + i] = f;
          u = `this.f${i}(a)`;
          v = `this.f${i}(b)`;
        }
        return _compare(u, v, -o, o);
      };
      const fn = Function('a', 'b', 'var u, v; return ' + fields.map(map).join('') + '0;');
      return t ? fn.bind(t) : fn;
    }
  }
};

/**
 * Parse a dataflow operator.
 */
function parseOperator(spec) {
  const ctx = this;
  if (isOperator(spec.type) || !spec.type) {
    ctx.operator(spec, spec.update ? ctx.operatorExpression(spec.update) : null);
  } else {
    ctx.transform(spec, spec.type);
  }
}

/**
 * Parse and assign operator parameters.
 */
function parseOperatorParameters(spec) {
  const ctx = this;
  if (spec.params) {
    const op = ctx.get(spec.id);
    if (!op) error('Invalid operator id: ' + spec.id);
    ctx.dataflow.connect(op, op.parameters(ctx.parseParameters(spec.params), spec.react, spec.initonly));
  }
}

/**
 * Parse a set of operator parameters.
 */
function parseParameters(spec, params) {
  params = params || {};
  const ctx = this;
  for (const key in spec) {
    const value = spec[key];
    params[key] = isArray(value) ? value.map(v => parseParameter(v, ctx, params)) : parseParameter(value, ctx, params);
  }
  return params;
}

/**
 * Parse a single parameter.
 */
function parseParameter(spec, ctx, params) {
  if (!spec || !isObject(spec)) return spec;
  for (let i = 0, n = PARSERS.length, p; i < n; ++i) {
    p = PARSERS[i];
    if (hasOwnProperty(spec, p.key)) {
      return p.parse(spec, ctx, params);
    }
  }
  return spec;
}

/** Reference parsers. */
var PARSERS = [{
  key: '$ref',
  parse: getOperator
}, {
  key: '$key',
  parse: getKey
}, {
  key: '$expr',
  parse: getExpression
}, {
  key: '$field',
  parse: getField
}, {
  key: '$encode',
  parse: getEncode
}, {
  key: '$compare',
  parse: getCompare
}, {
  key: '$context',
  parse: getContext
}, {
  key: '$subflow',
  parse: getSubflow
}, {
  key: '$tupleid',
  parse: getTupleId
}];

/**
 * Resolve an operator reference.
 */
function getOperator(_, ctx) {
  return ctx.get(_.$ref) || error('Operator not defined: ' + _.$ref);
}

/**
 * Resolve an expression reference.
 */
function getExpression(_, ctx, params) {
  if (_.$params) {
    // parse expression parameters
    ctx.parseParameters(_.$params, params);
  }
  const k = 'e:' + _.$expr.code;
  return ctx.fn[k] || (ctx.fn[k] = accessor(ctx.parameterExpression(_.$expr), _.$fields));
}

/**
 * Resolve a key accessor reference.
 */
function getKey(_, ctx) {
  const k = 'k:' + _.$key + '_' + !!_.$flat;
  return ctx.fn[k] || (ctx.fn[k] = key(_.$key, _.$flat, ctx.expr.codegen));
}

/**
 * Resolve a field accessor reference.
 */
function getField(_, ctx) {
  if (!_.$field) return null;
  const k = 'f:' + _.$field + '_' + _.$name;
  return ctx.fn[k] || (ctx.fn[k] = field(_.$field, _.$name, ctx.expr.codegen));
}

/**
 * Resolve a comparator function reference.
 */
function getCompare(_, ctx) {
  // As of Vega 5.5.3, $tupleid sort is no longer used.
  // Keep here for now for backwards compatibility.
  const k = 'c:' + _.$compare + '_' + _.$order,
    c = array(_.$compare).map(_ => _ && _.$tupleid ? tupleid : _);
  return ctx.fn[k] || (ctx.fn[k] = compare(c, _.$order, ctx.expr.codegen));
}

/**
 * Resolve an encode operator reference.
 */
function getEncode(_, ctx) {
  const spec = _.$encode,
    encode = {};
  for (const name in spec) {
    const enc = spec[name];
    encode[name] = accessor(ctx.encodeExpression(enc.$expr), enc.$fields);
    encode[name].output = enc.$output;
  }
  return encode;
}

/**
 * Resolve a context reference.
 */
function getContext(_, ctx) {
  return ctx;
}

/**
 * Resolve a recursive subflow specification.
 */
function getSubflow(_, ctx) {
  const spec = _.$subflow;
  return function (dataflow, key, parent) {
    const subctx = ctx.fork().parse(spec),
      op = subctx.get(spec.operators[0].id),
      p = subctx.signals.parent;
    if (p) p.set(parent);
    op.detachSubflow = () => ctx.detach(subctx);
    return op;
  };
}

/**
 * Resolve a tuple id reference.
 */
function getTupleId() {
  return tupleid;
}

/**
 * Parse an event stream specification.
 */
function parseStream (spec) {
  var ctx = this,
    filter = spec.filter != null ? ctx.eventExpression(spec.filter) : undefined,
    stream = spec.stream != null ? ctx.get(spec.stream) : undefined,
    args;
  if (spec.source) {
    stream = ctx.events(spec.source, spec.type, filter);
  } else if (spec.merge) {
    args = spec.merge.map(_ => ctx.get(_));
    stream = args[0].merge.apply(args[0], args.slice(1));
  }
  if (spec.between) {
    args = spec.between.map(_ => ctx.get(_));
    stream = stream.between(args[0], args[1]);
  }
  if (spec.filter) {
    stream = stream.filter(filter);
  }
  if (spec.throttle != null) {
    stream = stream.throttle(+spec.throttle);
  }
  if (spec.debounce != null) {
    stream = stream.debounce(+spec.debounce);
  }
  if (stream == null) {
    error('Invalid stream definition: ' + JSON.stringify(spec));
  }
  if (spec.consume) stream.consume(true);
  ctx.stream(spec, stream);
}

/**
 * Parse an event-driven operator update.
 */
function parseUpdate (spec) {
  var ctx = this,
    srcid = isObject(srcid = spec.source) ? srcid.$ref : srcid,
    source = ctx.get(srcid),
    target = null,
    update = spec.update,
    params = undefined;
  if (!source) error('Source not defined: ' + spec.source);
  target = spec.target && spec.target.$expr ? ctx.eventExpression(spec.target.$expr) : ctx.get(spec.target);
  if (update && update.$expr) {
    if (update.$params) {
      params = ctx.parseParameters(update.$params);
    }
    update = ctx.handlerExpression(update.$expr);
  }
  ctx.update(spec, source, target, update, params);
}

const SKIP = {
  skip: true
};
function getState(options) {
  var ctx = this,
    state = {};
  if (options.signals) {
    var signals = state.signals = {};
    Object.keys(ctx.signals).forEach(key => {
      const op = ctx.signals[key];
      if (options.signals(key, op)) {
        signals[key] = op.value;
      }
    });
  }
  if (options.data) {
    var data = state.data = {};
    Object.keys(ctx.data).forEach(key => {
      const dataset = ctx.data[key];
      if (options.data(key, dataset)) {
        data[key] = dataset.input.value;
      }
    });
  }
  if (ctx.subcontext && options.recurse !== false) {
    state.subcontext = ctx.subcontext.map(ctx => ctx.getState(options));
  }
  return state;
}
function setState(state) {
  var ctx = this,
    df = ctx.dataflow,
    data = state.data,
    signals = state.signals;
  Object.keys(signals || {}).forEach(key => {
    df.update(ctx.signals[key], signals[key], SKIP);
  });
  Object.keys(data || {}).forEach(key => {
    df.pulse(ctx.data[key].input, df.changeset().remove(truthy).insert(data[key]));
  });
  (state.subcontext || []).forEach((substate, i) => {
    const subctx = ctx.subcontext[i];
    if (subctx) subctx.setState(substate);
  });
}

/**
 * Context objects store the current parse state.
 * Enables lookup of parsed operators, event streams, accessors, etc.
 * Provides a 'fork' method for creating child contexts for subflows.
 */
function context (df, transforms, functions, expr) {
  return new Context(df, transforms, functions, expr);
}
function Context(df, transforms, functions, expr) {
  this.dataflow = df;
  this.transforms = transforms;
  this.events = df.events.bind(df);
  this.expr = expr || expressionCodegen, this.signals = {};
  this.scales = {};
  this.nodes = {};
  this.data = {};
  this.fn = {};
  if (functions) {
    this.functions = Object.create(functions);
    this.functions.context = this;
  }
}
function Subcontext(ctx) {
  this.dataflow = ctx.dataflow;
  this.transforms = ctx.transforms;
  this.events = ctx.events;
  this.expr = ctx.expr;
  this.signals = Object.create(ctx.signals);
  this.scales = Object.create(ctx.scales);
  this.nodes = Object.create(ctx.nodes);
  this.data = Object.create(ctx.data);
  this.fn = Object.create(ctx.fn);
  if (ctx.functions) {
    this.functions = Object.create(ctx.functions);
    this.functions.context = this;
  }
}
Context.prototype = Subcontext.prototype = {
  fork() {
    const ctx = new Subcontext(this);
    (this.subcontext || (this.subcontext = [])).push(ctx);
    return ctx;
  },
  detach(ctx) {
    this.subcontext = this.subcontext.filter(c => c !== ctx);

    // disconnect all nodes in the subcontext
    // wipe out targets first for better efficiency
    const keys = Object.keys(ctx.nodes);
    for (const key of keys) ctx.nodes[key]._targets = null;
    for (const key of keys) ctx.nodes[key].detach();
    ctx.nodes = null;
  },
  get(id) {
    return this.nodes[id];
  },
  set(id, node) {
    return this.nodes[id] = node;
  },
  add(spec, op) {
    const ctx = this,
      df = ctx.dataflow,
      data = spec.value;
    ctx.set(spec.id, op);
    if (isCollect(spec.type) && data) {
      if (data.$ingest) {
        df.ingest(op, data.$ingest, data.$format);
      } else if (data.$request) {
        df.preload(op, data.$request, data.$format);
      } else {
        df.pulse(op, df.changeset().insert(data));
      }
    }
    if (spec.root) {
      ctx.root = op;
    }
    if (spec.parent) {
      let p = ctx.get(spec.parent.$ref);
      if (p) {
        df.connect(p, [op]);
        op.targets().add(p);
      } else {
        (ctx.unresolved = ctx.unresolved || []).push(() => {
          p = ctx.get(spec.parent.$ref);
          df.connect(p, [op]);
          op.targets().add(p);
        });
      }
    }
    if (spec.signal) {
      ctx.signals[spec.signal] = op;
    }
    if (spec.scale) {
      ctx.scales[spec.scale] = op;
    }
    if (spec.data) {
      for (const name in spec.data) {
        const data = ctx.data[name] || (ctx.data[name] = {});
        spec.data[name].forEach(role => data[role] = op);
      }
    }
  },
  resolve() {
    (this.unresolved || []).forEach(fn => fn());
    delete this.unresolved;
    return this;
  },
  operator(spec, update) {
    this.add(spec, this.dataflow.add(spec.value, update));
  },
  transform(spec, type) {
    this.add(spec, this.dataflow.add(this.transforms[canonicalType(type)]));
  },
  stream(spec, stream) {
    this.set(spec.id, stream);
  },
  update(spec, stream, target, update, params) {
    this.dataflow.on(stream, target, update, params, spec.options);
  },
  // expression parsing
  operatorExpression(expr) {
    return this.expr.operator(this, expr);
  },
  parameterExpression(expr) {
    return this.expr.parameter(this, expr);
  },
  eventExpression(expr) {
    return this.expr.event(this, expr);
  },
  handlerExpression(expr) {
    return this.expr.handler(this, expr);
  },
  encodeExpression(encode) {
    return this.expr.encode(this, encode);
  },
  // parse methods
  parse,
  parseOperator,
  parseOperatorParameters,
  parseParameters,
  parseStream,
  parseUpdate,
  // state methods
  getState,
  setState
};

export { context };
