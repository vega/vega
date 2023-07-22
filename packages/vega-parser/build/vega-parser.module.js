import { isObject, isArray, extend, hasOwnProperty, array, stringValue, peek, error, isString, splitAccessPath, mergeConfig } from 'vega-util';
import { parseExpression } from 'vega-functions';
import { parseSelector } from 'vega-event-selector';
import { isValidScaleType, isDiscrete, isQuantile, isContinuous, isDiscretizing } from 'vega-scale';
import { definition as definition$1 } from 'vega-dataflow';

function parseAutosize (spec) {
  return isObject(spec) ? spec : {
    type: spec || 'pad'
  };
}

const number = _ => +_ || 0;
const paddingObject = _ => ({
  top: _,
  bottom: _,
  left: _,
  right: _
});
function parsePadding (spec) {
  return !isObject(spec) ? paddingObject(number(spec)) : spec.signal ? spec : {
    top: number(spec.top),
    bottom: number(spec.bottom),
    left: number(spec.left),
    right: number(spec.right)
  };
}

const encoder = _ => isObject(_) && !isArray(_) ? extend({}, _) : {
  value: _
};
function addEncode(object, name, value, set) {
  if (value != null) {
    const isEncoder = isObject(value) && !isArray(value) || isArray(value) && value.length && isObject(value[0]);

    // Always assign signal to update, even if the signal is from the enter block
    if (isEncoder) {
      object.update[name] = value;
    } else {
      object[set || 'enter'][name] = {
        value: value
      };
    }
    return 1;
  } else {
    return 0;
  }
}
function addEncoders(object, enter, update) {
  for (const name in enter) {
    addEncode(object, name, enter[name]);
  }
  for (const name in update) {
    addEncode(object, name, update[name], 'update');
  }
}
function extendEncode(encode, extra, skip) {
  for (const name in extra) {
    if (skip && hasOwnProperty(skip, name)) continue;
    encode[name] = extend(encode[name] || {}, extra[name]);
  }
  return encode;
}
function has(key, encode) {
  return encode && (encode.enter && encode.enter[key] || encode.update && encode.update[key]);
}

const MarkRole = 'mark';
const FrameRole = 'frame';
const ScopeRole = 'scope';
const AxisRole = 'axis';
const AxisDomainRole = 'axis-domain';
const AxisGridRole = 'axis-grid';
const AxisLabelRole = 'axis-label';
const AxisTickRole = 'axis-tick';
const AxisTitleRole = 'axis-title';
const LegendRole = 'legend';
const LegendBandRole = 'legend-band';
const LegendEntryRole = 'legend-entry';
const LegendGradientRole = 'legend-gradient';
const LegendLabelRole = 'legend-label';
const LegendSymbolRole = 'legend-symbol';
const LegendTitleRole = 'legend-title';
const TitleRole = 'title';
const TitleTextRole = 'title-text';
const TitleSubtitleRole = 'title-subtitle';

function applyDefaults (encode, type, role, style, config) {
  const defaults = {},
    enter = {};
  let update, key, skip, props;

  // if text mark, apply global lineBreak settings (#2370)
  key = 'lineBreak';
  if (type === 'text' && config[key] != null && !has(key, encode)) {
    applyDefault(defaults, key, config[key]);
  }

  // ignore legend and axis roles
  if (role == 'legend' || String(role).startsWith('axis')) {
    role = null;
  }

  // resolve mark config
  props = role === FrameRole ? config.group : role === MarkRole ? extend({}, config.mark, config[type]) : null;
  for (key in props) {
    // do not apply defaults if relevant fields are defined
    skip = has(key, encode) || (key === 'fill' || key === 'stroke') && (has('fill', encode) || has('stroke', encode));
    if (!skip) applyDefault(defaults, key, props[key]);
  }

  // resolve styles, apply with increasing precedence
  array(style).forEach(name => {
    const props = config.style && config.style[name];
    for (const key in props) {
      if (!has(key, encode)) {
        applyDefault(defaults, key, props[key]);
      }
    }
  });
  encode = extend({}, encode); // defensive copy
  for (key in defaults) {
    props = defaults[key];
    if (props.signal) {
      (update = update || {})[key] = props;
    } else {
      enter[key] = props;
    }
  }
  encode.enter = extend(enter, encode.enter);
  if (update) encode.update = extend(update, encode.update);
  return encode;
}
function applyDefault(defaults, key, value) {
  defaults[key] = value && value.signal ? {
    signal: value.signal
  } : {
    value: value
  };
}

const scaleRef = scale => isString(scale) ? stringValue(scale) : scale.signal ? `(${scale.signal})` : field(scale);
function entry$1(enc) {
  if (enc.gradient != null) {
    return gradient(enc);
  }
  let value = enc.signal ? `(${enc.signal})` : enc.color ? color(enc.color) : enc.field != null ? field(enc.field) : enc.value !== undefined ? stringValue(enc.value) : undefined;
  if (enc.scale != null) {
    value = scale(enc, value);
  }
  if (value === undefined) {
    value = null;
  }
  if (enc.exponent != null) {
    value = `pow(${value},${property(enc.exponent)})`;
  }
  if (enc.mult != null) {
    value += `*${property(enc.mult)}`;
  }
  if (enc.offset != null) {
    value += `+${property(enc.offset)}`;
  }
  if (enc.round) {
    value = `round(${value})`;
  }
  return value;
}
const _color = (type, x, y, z) => `(${type}(${[x, y, z].map(entry$1).join(',')})+'')`;
function color(enc) {
  return enc.c ? _color('hcl', enc.h, enc.c, enc.l) : enc.h || enc.s ? _color('hsl', enc.h, enc.s, enc.l) : enc.l || enc.a ? _color('lab', enc.l, enc.a, enc.b) : enc.r || enc.g || enc.b ? _color('rgb', enc.r, enc.g, enc.b) : null;
}
function gradient(enc) {
  // map undefined to null; expression lang does not allow undefined
  const args = [enc.start, enc.stop, enc.count].map(_ => _ == null ? null : stringValue(_));

  // trim null inputs from the end
  while (args.length && peek(args) == null) args.pop();
  args.unshift(scaleRef(enc.gradient));
  return `gradient(${args.join(',')})`;
}
function property(property) {
  return isObject(property) ? '(' + entry$1(property) + ')' : property;
}
function field(ref) {
  return resolveField(isObject(ref) ? ref : {
    datum: ref
  });
}
function resolveField(ref) {
  let object, level, field;
  if (ref.signal) {
    object = 'datum';
    field = ref.signal;
  } else if (ref.group || ref.parent) {
    level = Math.max(1, ref.level || 1);
    object = 'item';
    while (level-- > 0) {
      object += '.mark.group';
    }
    if (ref.parent) {
      field = ref.parent;
      object += '.datum';
    } else {
      field = ref.group;
    }
  } else if (ref.datum) {
    object = 'datum';
    field = ref.datum;
  } else {
    error('Invalid field reference: ' + stringValue(ref));
  }
  if (!ref.signal) {
    field = isString(field) ? splitAccessPath(field).map(stringValue).join('][') : resolveField(field);
  }
  return object + '[' + field + ']';
}
function scale(enc, value) {
  const scale = scaleRef(enc.scale);
  if (enc.range != null) {
    // pull value from scale range
    value = `lerp(_range(${scale}), ${+enc.range})`;
  } else {
    // run value through scale and/or pull scale bandwidth
    if (value !== undefined) value = `_scale(${scale}, ${value})`;
    if (enc.band) {
      value = (value ? value + '+' : '') + `_bandwidth(${scale})` + (+enc.band === 1 ? '' : '*' + property(enc.band));
      if (enc.extra) {
        // include logic to handle extraneous elements
        value = `(datum.extra ? _scale(${scale}, datum.extra.value) : ${value})`;
      }
    }
    if (value == null) value = '0';
  }
  return value;
}

function rule (enc) {
  let code = '';
  enc.forEach(rule => {
    const value = entry$1(rule);
    code += rule.test ? `(${rule.test})?${value}:` : value;
  });

  // if no else clause, terminate with null (#1366)
  if (peek(code) === ':') {
    code += 'null';
  }
  return code;
}

function parseEncode (encode, type, role, style, scope, params) {
  const enc = {};
  params = params || {};
  params.encoders = {
    $encode: enc
  };
  encode = applyDefaults(encode, type, role, style, scope.config);
  for (const key in encode) {
    enc[key] = parseBlock(encode[key], type, params, scope);
  }
  return params;
}
function parseBlock(block, marktype, params, scope) {
  const channels = {},
    fields = {};
  for (const name in block) {
    if (block[name] != null) {
      // skip any null entries
      channels[name] = parse$1(expr(block[name]), scope, params, fields);
    }
  }
  return {
    $expr: {
      marktype,
      channels
    },
    $fields: Object.keys(fields),
    $output: Object.keys(block)
  };
}
function expr(enc) {
  return isArray(enc) ? rule(enc) : entry$1(enc);
}
function parse$1(code, scope, params, fields) {
  const expr = parseExpression(code, scope);
  expr.$fields.forEach(name => fields[name] = 1);
  extend(params, expr.$params);
  return expr.$expr;
}

const OUTER = 'outer',
  OUTER_INVALID = ['value', 'update', 'init', 'react', 'bind'];
function outerError(prefix, name) {
  error(prefix + ' for "outer" push: ' + stringValue(name));
}
function parseSignal (signal, scope) {
  const name = signal.name;
  if (signal.push === OUTER) {
    // signal must already be defined, raise error if not
    if (!scope.signals[name]) outerError('No prior signal definition', name);
    // signal push must not use properties reserved for standard definition
    OUTER_INVALID.forEach(prop => {
      if (signal[prop] !== undefined) outerError('Invalid property ', prop);
    });
  } else {
    // define a new signal in the current scope
    const op = scope.addSignal(name, signal.value);
    if (signal.react === false) op.react = false;
    if (signal.bind) scope.addBinding(name, signal.bind);
  }
}

function Entry(type, value, params, parent) {
  this.id = -1;
  this.type = type;
  this.value = value;
  this.params = params;
  if (parent) this.parent = parent;
}
function entry(type, value, params, parent) {
  return new Entry(type, value, params, parent);
}
function operator(value, params) {
  return entry('operator', value, params);
}

// -----

function ref(op) {
  const ref = {
    $ref: op.id
  };
  // if operator not yet registered, cache ref to resolve later
  if (op.id < 0) (op.refs = op.refs || []).push(ref);
  return ref;
}
function fieldRef$1(field, name) {
  return name ? {
    $field: field,
    $name: name
  } : {
    $field: field
  };
}
const keyFieldRef = fieldRef$1('key');
function compareRef(fields, orders) {
  return {
    $compare: fields,
    $order: orders
  };
}
function keyRef(fields, flat) {
  const ref = {
    $key: fields
  };
  if (flat) ref.$flat = true;
  return ref;
}

// -----

const Ascending = 'ascending';
const Descending = 'descending';
function sortKey(sort) {
  return !isObject(sort) ? '' : (sort.order === Descending ? '-' : '+') + aggrField(sort.op, sort.field);
}
function aggrField(op, field) {
  return (op && op.signal ? '$' + op.signal : op || '') + (op && field ? '_' : '') + (field && field.signal ? '$' + field.signal : field || '');
}

// -----

const Scope$1 = 'scope';
const View = 'view';
function isSignal(_) {
  return _ && _.signal;
}
function isExpr$1(_) {
  return _ && _.expr;
}
function hasSignal(_) {
  if (isSignal(_)) return true;
  if (isObject(_)) for (const key in _) {
    if (hasSignal(_[key])) return true;
  }
  return false;
}
function value(specValue, defaultValue) {
  return specValue != null ? specValue : defaultValue;
}
function deref(v) {
  return v && v.signal || v;
}

const Timer = 'timer';
function parseStream(stream, scope) {
  const method = stream.merge ? mergeStream : stream.stream ? nestedStream : stream.type ? eventStream : error('Invalid stream specification: ' + stringValue(stream));
  return method(stream, scope);
}
function eventSource(source) {
  return source === Scope$1 ? View : source || View;
}
function mergeStream(stream, scope) {
  const list = stream.merge.map(s => parseStream(s, scope)),
    entry = streamParameters({
      merge: list
    }, stream, scope);
  return scope.addStream(entry).id;
}
function nestedStream(stream, scope) {
  const id = parseStream(stream.stream, scope),
    entry = streamParameters({
      stream: id
    }, stream, scope);
  return scope.addStream(entry).id;
}
function eventStream(stream, scope) {
  let id;
  if (stream.type === Timer) {
    id = scope.event(Timer, stream.throttle);
    stream = {
      between: stream.between,
      filter: stream.filter
    };
  } else {
    id = scope.event(eventSource(stream.source), stream.type);
  }
  const entry = streamParameters({
    stream: id
  }, stream, scope);
  return Object.keys(entry).length === 1 ? id : scope.addStream(entry).id;
}
function streamParameters(entry, stream, scope) {
  let param = stream.between;
  if (param) {
    if (param.length !== 2) {
      error('Stream "between" parameter must have 2 entries: ' + stringValue(stream));
    }
    entry.between = [parseStream(param[0], scope), parseStream(param[1], scope)];
  }
  param = stream.filter ? [].concat(stream.filter) : [];
  if (stream.marktype || stream.markname || stream.markrole) {
    // add filter for mark type, name and/or role
    param.push(filterMark(stream.marktype, stream.markname, stream.markrole));
  }
  if (stream.source === Scope$1) {
    // add filter to limit events from sub-scope only
    param.push('inScope(event.item)');
  }
  if (param.length) {
    entry.filter = parseExpression('(' + param.join(')&&(') + ')', scope).$expr;
  }
  if ((param = stream.throttle) != null) {
    entry.throttle = +param;
  }
  if ((param = stream.debounce) != null) {
    entry.debounce = +param;
  }
  if (stream.consume) {
    entry.consume = true;
  }
  return entry;
}
function filterMark(type, name, role) {
  const item = 'event.item';
  return item + (type && type !== '*' ? '&&' + item + '.mark.marktype===\'' + type + '\'' : '') + (role ? '&&' + item + '.mark.role===\'' + role + '\'' : '') + (name ? '&&' + item + '.mark.name===\'' + name + '\'' : '');
}

// bypass expression parser for internal operator references
const OP_VALUE_EXPR = {
  code: '_.$value',
  ast: {
    type: 'Identifier',
    value: 'value'
  }
};
function parseUpdate (spec, scope, target) {
  const encode = spec.encode,
    entry = {
      target: target
    };
  let events = spec.events,
    update = spec.update,
    sources = [];
  if (!events) {
    error('Signal update missing events specification.');
  }

  // interpret as an event selector string
  if (isString(events)) {
    events = parseSelector(events, scope.isSubscope() ? Scope$1 : View);
  }

  // separate event streams from signal updates
  events = array(events).filter(s => s.signal || s.scale ? (sources.push(s), 0) : 1);

  // merge internal operator listeners
  if (sources.length > 1) {
    sources = [mergeSources(sources)];
  }

  // merge event streams, include as source
  if (events.length) {
    sources.push(events.length > 1 ? {
      merge: events
    } : events[0]);
  }
  if (encode != null) {
    if (update) error('Signal encode and update are mutually exclusive.');
    update = 'encode(item(),' + stringValue(encode) + ')';
  }

  // resolve update value
  entry.update = isString(update) ? parseExpression(update, scope) : update.expr != null ? parseExpression(update.expr, scope) : update.value != null ? update.value : update.signal != null ? {
    $expr: OP_VALUE_EXPR,
    $params: {
      $value: scope.signalRef(update.signal)
    }
  } : error('Invalid signal update specification.');
  if (spec.force) {
    entry.options = {
      force: true
    };
  }
  sources.forEach(source => scope.addUpdate(extend(streamSource(source, scope), entry)));
}
function streamSource(stream, scope) {
  return {
    source: stream.signal ? scope.signalRef(stream.signal) : stream.scale ? scope.scaleRef(stream.scale) : parseStream(stream, scope)
  };
}
function mergeSources(sources) {
  return {
    signal: '[' + sources.map(s => s.scale ? 'scale("' + s.scale + '")' : s.signal) + ']'
  };
}

function parseSignalUpdates (signal, scope) {
  const op = scope.getSignal(signal.name);
  let expr = signal.update;
  if (signal.init) {
    if (expr) {
      error('Signals can not include both init and update expressions.');
    } else {
      expr = signal.init;
      op.initonly = true;
    }
  }
  if (expr) {
    expr = parseExpression(expr, scope);
    op.update = expr.$expr;
    op.params = expr.$params;
  }
  if (signal.on) {
    signal.on.forEach(_ => parseUpdate(_, scope, op.id));
  }
}

const transform = name => (params, value, parent) => entry(name, value, params || undefined, parent);
const Aggregate = transform('aggregate');
const AxisTicks = transform('axisticks');
const Bound = transform('bound');
const Collect = transform('collect');
const Compare = transform('compare');
const DataJoin = transform('datajoin');
const Encode = transform('encode');
const Expression = transform('expression');
const Facet = transform('facet');
const Field = transform('field');
const Key = transform('key');
const LegendEntries = transform('legendentries');
const Load = transform('load');
const Mark = transform('mark');
const MultiExtent = transform('multiextent');
const MultiValues = transform('multivalues');
const Overlap = transform('overlap');
const Params = transform('params');
const PreFacet = transform('prefacet');
const Projection = transform('projection');
const Proxy = transform('proxy');
const Relay = transform('relay');
const Render = transform('render');
const Scale = transform('scale');
const Sieve = transform('sieve');
const SortItems = transform('sortitems');
const ViewLayout = transform('viewlayout');
const Values = transform('values');

let FIELD_REF_ID = 0;
const MULTIDOMAIN_SORT_OPS = {
  min: 'min',
  max: 'max',
  count: 'sum'
};
function initScale(spec, scope) {
  const type = spec.type || 'linear';
  if (!isValidScaleType(type)) {
    error('Unrecognized scale type: ' + stringValue(type));
  }
  scope.addScale(spec.name, {
    type,
    domain: undefined
  });
}
function parseScale(spec, scope) {
  const params = scope.getScale(spec.name).params;
  let key;
  params.domain = parseScaleDomain(spec.domain, spec, scope);
  if (spec.range != null) {
    params.range = parseScaleRange(spec, scope, params);
  }
  if (spec.interpolate != null) {
    parseScaleInterpolate(spec.interpolate, params);
  }
  if (spec.nice != null) {
    params.nice = parseScaleNice(spec.nice);
  }
  if (spec.bins != null) {
    params.bins = parseScaleBins(spec.bins, scope);
  }
  for (key in spec) {
    if (hasOwnProperty(params, key) || key === 'name') continue;
    params[key] = parseLiteral(spec[key], scope);
  }
}
function parseLiteral(v, scope) {
  return !isObject(v) ? v : v.signal ? scope.signalRef(v.signal) : error('Unsupported object: ' + stringValue(v));
}
function parseArray(v, scope) {
  return v.signal ? scope.signalRef(v.signal) : v.map(v => parseLiteral(v, scope));
}
function dataLookupError(name) {
  error('Can not find data set: ' + stringValue(name));
}

// -- SCALE DOMAIN ----

function parseScaleDomain(domain, spec, scope) {
  if (!domain) {
    if (spec.domainMin != null || spec.domainMax != null) {
      error('No scale domain defined for domainMin/domainMax to override.');
    }
    return; // default domain
  }

  return domain.signal ? scope.signalRef(domain.signal) : (isArray(domain) ? explicitDomain : domain.fields ? multipleDomain : singularDomain)(domain, spec, scope);
}
function explicitDomain(domain, spec, scope) {
  return domain.map(v => parseLiteral(v, scope));
}
function singularDomain(domain, spec, scope) {
  const data = scope.getData(domain.data);
  if (!data) dataLookupError(domain.data);
  return isDiscrete(spec.type) ? data.valuesRef(scope, domain.field, parseSort(domain.sort, false)) : isQuantile(spec.type) ? data.domainRef(scope, domain.field) : data.extentRef(scope, domain.field);
}
function multipleDomain(domain, spec, scope) {
  const data = domain.data,
    fields = domain.fields.reduce((dom, d) => {
      d = isString(d) ? {
        data: data,
        field: d
      } : isArray(d) || d.signal ? fieldRef(d, scope) : d;
      dom.push(d);
      return dom;
    }, []);
  return (isDiscrete(spec.type) ? ordinalMultipleDomain : isQuantile(spec.type) ? quantileMultipleDomain : numericMultipleDomain)(domain, scope, fields);
}
function fieldRef(data, scope) {
  const name = '_:vega:_' + FIELD_REF_ID++,
    coll = Collect({});
  if (isArray(data)) {
    coll.value = {
      $ingest: data
    };
  } else if (data.signal) {
    const code = 'setdata(' + stringValue(name) + ',' + data.signal + ')';
    coll.params.input = scope.signalRef(code);
  }
  scope.addDataPipeline(name, [coll, Sieve({})]);
  return {
    data: name,
    field: 'data'
  };
}
function ordinalMultipleDomain(domain, scope, fields) {
  const sort = parseSort(domain.sort, true);
  let a, v;

  // get value counts for each domain field
  const counts = fields.map(f => {
    const data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.countsRef(scope, f.field, sort);
  });

  // aggregate the results from each domain field
  const p = {
    groupby: keyFieldRef,
    pulse: counts
  };
  if (sort) {
    a = sort.op || 'count';
    v = sort.field ? aggrField(a, sort.field) : 'count';
    p.ops = [MULTIDOMAIN_SORT_OPS[a]];
    p.fields = [scope.fieldRef(v)];
    p.as = [v];
  }
  a = scope.add(Aggregate(p));

  // collect aggregate output
  const c = scope.add(Collect({
    pulse: ref(a)
  }));

  // extract values for combined domain
  v = scope.add(Values({
    field: keyFieldRef,
    sort: scope.sortRef(sort),
    pulse: ref(c)
  }));
  return ref(v);
}
function parseSort(sort, multidomain) {
  if (sort) {
    if (!sort.field && !sort.op) {
      if (isObject(sort)) sort.field = 'key';else sort = {
        field: 'key'
      };
    } else if (!sort.field && sort.op !== 'count') {
      error('No field provided for sort aggregate op: ' + sort.op);
    } else if (multidomain && sort.field) {
      if (sort.op && !MULTIDOMAIN_SORT_OPS[sort.op]) {
        error('Multiple domain scales can not be sorted using ' + sort.op);
      }
    }
  }
  return sort;
}
function quantileMultipleDomain(domain, scope, fields) {
  // get value arrays for each domain field
  const values = fields.map(f => {
    const data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.domainRef(scope, f.field);
  });

  // combine value arrays
  return ref(scope.add(MultiValues({
    values: values
  })));
}
function numericMultipleDomain(domain, scope, fields) {
  // get extents for each domain field
  const extents = fields.map(f => {
    const data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.extentRef(scope, f.field);
  });

  // combine extents
  return ref(scope.add(MultiExtent({
    extents: extents
  })));
}

// -- SCALE BINS -----

function parseScaleBins(v, scope) {
  return v.signal || isArray(v) ? parseArray(v, scope) : scope.objectProperty(v);
}

// -- SCALE NICE -----

function parseScaleNice(nice) {
  return isObject(nice) ? {
    interval: parseLiteral(nice.interval),
    step: parseLiteral(nice.step)
  } : parseLiteral(nice);
}

// -- SCALE INTERPOLATION -----

function parseScaleInterpolate(interpolate, params) {
  params.interpolate = parseLiteral(interpolate.type || interpolate);
  if (interpolate.gamma != null) {
    params.interpolateGamma = parseLiteral(interpolate.gamma);
  }
}

// -- SCALE RANGE -----

function parseScaleRange(spec, scope, params) {
  const config = scope.config.range;
  let range = spec.range;
  if (range.signal) {
    return scope.signalRef(range.signal);
  } else if (isString(range)) {
    if (config && hasOwnProperty(config, range)) {
      spec = extend({}, spec, {
        range: config[range]
      });
      return parseScaleRange(spec, scope, params);
    } else if (range === 'width') {
      range = [0, {
        signal: 'width'
      }];
    } else if (range === 'height') {
      range = isDiscrete(spec.type) ? [0, {
        signal: 'height'
      }] : [{
        signal: 'height'
      }, 0];
    } else {
      error('Unrecognized scale range value: ' + stringValue(range));
    }
  } else if (range.scheme) {
    params.scheme = isArray(range.scheme) ? parseArray(range.scheme, scope) : parseLiteral(range.scheme, scope);
    if (range.extent) params.schemeExtent = parseArray(range.extent, scope);
    if (range.count) params.schemeCount = parseLiteral(range.count, scope);
    return;
  } else if (range.step) {
    params.rangeStep = parseLiteral(range.step, scope);
    return;
  } else if (isDiscrete(spec.type) && !isArray(range)) {
    return parseScaleDomain(range, spec, scope);
  } else if (!isArray(range)) {
    error('Unsupported range type: ' + stringValue(range));
  }
  return range.map(v => (isArray(v) ? parseArray : parseLiteral)(v, scope));
}

function parseProjection (proj, scope) {
  const config = scope.config.projection || {},
    params = {};
  for (const name in proj) {
    if (name === 'name') continue;
    params[name] = parseParameter$1(proj[name], name, scope);
  }

  // apply projection defaults from config
  for (const name in config) {
    if (params[name] == null) {
      params[name] = parseParameter$1(config[name], name, scope);
    }
  }
  scope.addProjection(proj.name, params);
}
function parseParameter$1(_, name, scope) {
  return isArray(_) ? _.map(_ => parseParameter$1(_, name, scope)) : !isObject(_) ? _ : _.signal ? scope.signalRef(_.signal) : name === 'fit' ? _ : error('Unsupported parameter object: ' + stringValue(_));
}

const Top = 'top';
const Left = 'left';
const Right = 'right';
const Bottom = 'bottom';
const Center = 'center';
const Vertical = 'vertical';
const Start = 'start';
const Middle = 'middle';
const End = 'end';
const Index = 'index';
const Label = 'label';
const Offset = 'offset';
const Perc = 'perc';
const Perc2 = 'perc2';
const Value = 'value';
const GuideLabelStyle = 'guide-label';
const GuideTitleStyle = 'guide-title';
const GroupTitleStyle = 'group-title';
const GroupSubtitleStyle = 'group-subtitle';
const Symbols = 'symbol';
const Gradient = 'gradient';
const Discrete = 'discrete';
const Size = 'size';
const Shape = 'shape';
const Fill = 'fill';
const Stroke = 'stroke';
const StrokeWidth = 'strokeWidth';
const StrokeDash = 'strokeDash';
const Opacity = 'opacity';

// Encoding channels supported by legends
// In priority order of 'canonical' scale
const LegendScales = [Size, Shape, Fill, Stroke, StrokeWidth, StrokeDash, Opacity];
const Skip = {
  name: 1,
  style: 1,
  interactive: 1
};
const zero = {
  value: 0
};
const one = {
  value: 1
};

const GroupMark = 'group';
const RectMark = 'rect';
const RuleMark = 'rule';
const SymbolMark = 'symbol';
const TextMark = 'text';

function guideGroup (mark) {
  mark.type = GroupMark;
  mark.interactive = mark.interactive || false;
  return mark;
}

function lookup(spec, config) {
  const _ = (name, dflt) => value(spec[name], value(config[name], dflt));
  _.isVertical = s => Vertical === value(spec.direction, config.direction || (s ? config.symbolDirection : config.gradientDirection));
  _.gradientLength = () => value(spec.gradientLength, config.gradientLength || config.gradientWidth);
  _.gradientThickness = () => value(spec.gradientThickness, config.gradientThickness || config.gradientHeight);
  _.entryColumns = () => value(spec.columns, value(config.columns, +_.isVertical(true)));
  return _;
}
function getEncoding(name, encode) {
  const v = encode && (encode.update && encode.update[name] || encode.enter && encode.enter[name]);
  return v && v.signal ? v : v ? v.value : null;
}
function getStyle(name, scope, style) {
  const s = scope.config.style[style];
  return s && s[name];
}
function anchorExpr(s, e, m) {
  return `item.anchor === '${Start}' ? ${s} : item.anchor === '${End}' ? ${e} : ${m}`;
}
const alignExpr$1 = anchorExpr(stringValue(Left), stringValue(Right), stringValue(Center));
function tickBand(_) {
  const v = _('tickBand');
  let offset = _('tickOffset'),
    band,
    extra;
  if (!v) {
    // if no tick band entry, fall back on other properties
    band = _('bandPosition');
    extra = _('tickExtra');
  } else if (v.signal) {
    // if signal, augment code to interpret values
    band = {
      signal: `(${v.signal}) === 'extent' ? 1 : 0.5`
    };
    extra = {
      signal: `(${v.signal}) === 'extent'`
    };
    if (!isObject(offset)) {
      offset = {
        signal: `(${v.signal}) === 'extent' ? 0 : ${offset}`
      };
    }
  } else if (v === 'extent') {
    // if constant, simply set values
    band = 1;
    extra = true;
    offset = 0;
  } else {
    band = 0.5;
    extra = false;
  }
  return {
    extra,
    band,
    offset
  };
}
function extendOffset(value, offset) {
  return !offset ? value : !value ? offset : !isObject(value) ? {
    value,
    offset
  } : Object.assign({}, value, {
    offset: extendOffset(value.offset, offset)
  });
}

function guideMark (mark, extras) {
  if (extras) {
    mark.name = extras.name;
    mark.style = extras.style || mark.style;
    mark.interactive = !!extras.interactive;
    mark.encode = extendEncode(mark.encode, extras, Skip);
  } else {
    mark.interactive = false;
  }
  return mark;
}

function legendGradient (spec, scale, config, userEncode) {
  const _ = lookup(spec, config),
    vertical = _.isVertical(),
    thickness = _.gradientThickness(),
    length = _.gradientLength();
  let enter, start, stop, width, height;
  if (vertical) {
    start = [0, 1];
    stop = [0, 0];
    width = thickness;
    height = length;
  } else {
    start = [0, 0];
    stop = [1, 0];
    width = length;
    height = thickness;
  }
  const encode = {
    enter: enter = {
      opacity: zero,
      x: zero,
      y: zero,
      width: encoder(width),
      height: encoder(height)
    },
    update: extend({}, enter, {
      opacity: one,
      fill: {
        gradient: scale,
        start: start,
        stop: stop
      }
    }),
    exit: {
      opacity: zero
    }
  };
  addEncoders(encode, {
    stroke: _('gradientStrokeColor'),
    strokeWidth: _('gradientStrokeWidth')
  }, {
    // update
    opacity: _('gradientOpacity')
  });
  return guideMark({
    type: RectMark,
    role: LegendGradientRole,
    encode
  }, userEncode);
}

function legendGradientDiscrete (spec, scale, config, userEncode, dataRef) {
  const _ = lookup(spec, config),
    vertical = _.isVertical(),
    thickness = _.gradientThickness(),
    length = _.gradientLength();
  let u,
    v,
    uu,
    vv,
    adjust = '';
  vertical ? (u = 'y', uu = 'y2', v = 'x', vv = 'width', adjust = '1-') : (u = 'x', uu = 'x2', v = 'y', vv = 'height');
  const enter = {
    opacity: zero,
    fill: {
      scale: scale,
      field: Value
    }
  };
  enter[u] = {
    signal: adjust + 'datum.' + Perc,
    mult: length
  };
  enter[v] = zero;
  enter[uu] = {
    signal: adjust + 'datum.' + Perc2,
    mult: length
  };
  enter[vv] = encoder(thickness);
  const encode = {
    enter: enter,
    update: extend({}, enter, {
      opacity: one
    }),
    exit: {
      opacity: zero
    }
  };
  addEncoders(encode, {
    stroke: _('gradientStrokeColor'),
    strokeWidth: _('gradientStrokeWidth')
  }, {
    // update
    opacity: _('gradientOpacity')
  });
  return guideMark({
    type: RectMark,
    role: LegendBandRole,
    key: Value,
    from: dataRef,
    encode
  }, userEncode);
}

const alignExpr = `datum.${Perc}<=0?"${Left}":datum.${Perc}>=1?"${Right}":"${Center}"`,
  baselineExpr = `datum.${Perc}<=0?"${Bottom}":datum.${Perc}>=1?"${Top}":"${Middle}"`;
function legendGradientLabels (spec, config, userEncode, dataRef) {
  const _ = lookup(spec, config),
    vertical = _.isVertical(),
    thickness = encoder(_.gradientThickness()),
    length = _.gradientLength();
  let overlap = _('labelOverlap'),
    enter,
    update,
    u,
    v,
    adjust = '';
  const encode = {
    enter: enter = {
      opacity: zero
    },
    update: update = {
      opacity: one,
      text: {
        field: Label
      }
    },
    exit: {
      opacity: zero
    }
  };
  addEncoders(encode, {
    fill: _('labelColor'),
    fillOpacity: _('labelOpacity'),
    font: _('labelFont'),
    fontSize: _('labelFontSize'),
    fontStyle: _('labelFontStyle'),
    fontWeight: _('labelFontWeight'),
    limit: value(spec.labelLimit, config.gradientLabelLimit)
  });
  if (vertical) {
    enter.align = {
      value: 'left'
    };
    enter.baseline = update.baseline = {
      signal: baselineExpr
    };
    u = 'y';
    v = 'x';
    adjust = '1-';
  } else {
    enter.align = update.align = {
      signal: alignExpr
    };
    enter.baseline = {
      value: 'top'
    };
    u = 'x';
    v = 'y';
  }
  enter[u] = update[u] = {
    signal: adjust + 'datum.' + Perc,
    mult: length
  };
  enter[v] = update[v] = thickness;
  thickness.offset = value(spec.labelOffset, config.gradientLabelOffset) || 0;
  overlap = overlap ? {
    separation: _('labelSeparation'),
    method: overlap,
    order: 'datum.' + Index
  } : undefined;

  // type, role, style, key, dataRef, encode, extras
  return guideMark({
    type: TextMark,
    role: LegendLabelRole,
    style: GuideLabelStyle,
    key: Value,
    from: dataRef,
    encode,
    overlap
  }, userEncode);
}

// userEncode is top-level, includes entries, symbols, labels
function legendSymbolGroups (spec, config, userEncode, dataRef, columns) {
  const _ = lookup(spec, config),
    entries = userEncode.entries,
    interactive = !!(entries && entries.interactive),
    name = entries ? entries.name : undefined,
    height = _('clipHeight'),
    symbolOffset = _('symbolOffset'),
    valueRef = {
      data: 'value'
    },
    xSignal = `(${columns}) ? datum.${Offset} : datum.${Size}`,
    yEncode = height ? encoder(height) : {
      field: Size
    },
    index = `datum.${Index}`,
    ncols = `max(1, ${columns})`;
  let encode, enter, update, nrows, sort;
  yEncode.mult = 0.5;

  // -- LEGEND SYMBOLS --
  encode = {
    enter: enter = {
      opacity: zero,
      x: {
        signal: xSignal,
        mult: 0.5,
        offset: symbolOffset
      },
      y: yEncode
    },
    update: update = {
      opacity: one,
      x: enter.x,
      y: enter.y
    },
    exit: {
      opacity: zero
    }
  };
  let baseFill = null,
    baseStroke = null;
  if (!spec.fill) {
    baseFill = config.symbolBaseFillColor;
    baseStroke = config.symbolBaseStrokeColor;
  }
  addEncoders(encode, {
    fill: _('symbolFillColor', baseFill),
    shape: _('symbolType'),
    size: _('symbolSize'),
    stroke: _('symbolStrokeColor', baseStroke),
    strokeDash: _('symbolDash'),
    strokeDashOffset: _('symbolDashOffset'),
    strokeWidth: _('symbolStrokeWidth')
  }, {
    // update
    opacity: _('symbolOpacity')
  });
  LegendScales.forEach(scale => {
    if (spec[scale]) {
      update[scale] = enter[scale] = {
        scale: spec[scale],
        field: Value
      };
    }
  });
  const symbols = guideMark({
    type: SymbolMark,
    role: LegendSymbolRole,
    key: Value,
    from: valueRef,
    clip: height ? true : undefined,
    encode
  }, userEncode.symbols);

  // -- LEGEND LABELS --
  const labelOffset = encoder(symbolOffset);
  labelOffset.offset = _('labelOffset');
  encode = {
    enter: enter = {
      opacity: zero,
      x: {
        signal: xSignal,
        offset: labelOffset
      },
      y: yEncode
    },
    update: update = {
      opacity: one,
      text: {
        field: Label
      },
      x: enter.x,
      y: enter.y
    },
    exit: {
      opacity: zero
    }
  };
  addEncoders(encode, {
    align: _('labelAlign'),
    baseline: _('labelBaseline'),
    fill: _('labelColor'),
    fillOpacity: _('labelOpacity'),
    font: _('labelFont'),
    fontSize: _('labelFontSize'),
    fontStyle: _('labelFontStyle'),
    fontWeight: _('labelFontWeight'),
    limit: _('labelLimit')
  });
  const labels = guideMark({
    type: TextMark,
    role: LegendLabelRole,
    style: GuideLabelStyle,
    key: Value,
    from: valueRef,
    encode
  }, userEncode.labels);

  // -- LEGEND ENTRY GROUPS --
  encode = {
    enter: {
      noBound: {
        value: !height
      },
      // ignore width/height in bounds calc
      width: zero,
      height: height ? encoder(height) : zero,
      opacity: zero
    },
    exit: {
      opacity: zero
    },
    update: update = {
      opacity: one,
      row: {
        signal: null
      },
      column: {
        signal: null
      }
    }
  };

  // annotate and sort groups to ensure correct ordering
  if (_.isVertical(true)) {
    nrows = `ceil(item.mark.items.length / ${ncols})`;
    update.row.signal = `${index}%${nrows}`;
    update.column.signal = `floor(${index} / ${nrows})`;
    sort = {
      field: ['row', index]
    };
  } else {
    update.row.signal = `floor(${index} / ${ncols})`;
    update.column.signal = `${index} % ${ncols}`;
    sort = {
      field: index
    };
  }
  // handle zero column case (implies infinite columns)
  update.column.signal = `(${columns})?${update.column.signal}:${index}`;

  // facet legend entries into sub-groups
  dataRef = {
    facet: {
      data: dataRef,
      name: 'value',
      groupby: Index
    }
  };
  return guideGroup({
    role: ScopeRole,
    from: dataRef,
    encode: extendEncode(encode, entries, Skip),
    marks: [symbols, labels],
    name,
    interactive,
    sort
  });
}
function legendSymbolLayout(spec, config) {
  const _ = lookup(spec, config);

  // layout parameters for legend entries
  return {
    align: _('gridAlign'),
    columns: _.entryColumns(),
    center: {
      row: true,
      column: false
    },
    padding: {
      row: _('rowPadding'),
      column: _('columnPadding')
    }
  };
}

// expression logic for align, anchor, angle, and baseline calculation
const isL = 'item.orient === "left"',
  isR = 'item.orient === "right"',
  isLR = `(${isL} || ${isR})`,
  isVG = `datum.vgrad && ${isLR}`,
  baseline = anchorExpr('"top"', '"bottom"', '"middle"'),
  alignFlip = anchorExpr('"right"', '"left"', '"center"'),
  exprAlign = `datum.vgrad && ${isR} ? (${alignFlip}) : (${isLR} && !(datum.vgrad && ${isL})) ? "left" : ${alignExpr$1}`,
  exprAnchor = `item._anchor || (${isLR} ? "middle" : "start")`,
  exprAngle = `${isVG} ? (${isL} ? -90 : 90) : 0`,
  exprBaseline = `${isLR} ? (datum.vgrad ? (${isR} ? "bottom" : "top") : ${baseline}) : "top"`;
function legendTitle (spec, config, userEncode, dataRef) {
  const _ = lookup(spec, config);
  const encode = {
    enter: {
      opacity: zero
    },
    update: {
      opacity: one,
      x: {
        field: {
          group: 'padding'
        }
      },
      y: {
        field: {
          group: 'padding'
        }
      }
    },
    exit: {
      opacity: zero
    }
  };
  addEncoders(encode, {
    orient: _('titleOrient'),
    _anchor: _('titleAnchor'),
    anchor: {
      signal: exprAnchor
    },
    angle: {
      signal: exprAngle
    },
    align: {
      signal: exprAlign
    },
    baseline: {
      signal: exprBaseline
    },
    text: spec.title,
    fill: _('titleColor'),
    fillOpacity: _('titleOpacity'),
    font: _('titleFont'),
    fontSize: _('titleFontSize'),
    fontStyle: _('titleFontStyle'),
    fontWeight: _('titleFontWeight'),
    limit: _('titleLimit'),
    lineHeight: _('titleLineHeight')
  }, {
    // require update
    align: _('titleAlign'),
    baseline: _('titleBaseline')
  });
  return guideMark({
    type: TextMark,
    role: LegendTitleRole,
    style: GuideTitleStyle,
    from: dataRef,
    encode
  }, userEncode);
}

function clip (clip, scope) {
  let expr;
  if (isObject(clip)) {
    if (clip.signal) {
      expr = clip.signal;
    } else if (clip.path) {
      expr = 'pathShape(' + param(clip.path) + ')';
    } else if (clip.sphere) {
      expr = 'geoShape(' + param(clip.sphere) + ', {type: "Sphere"})';
    }
  }
  return expr ? scope.signalRef(expr) : !!clip;
}
function param(value) {
  return isObject(value) && value.signal ? value.signal : stringValue(value);
}

function getRole (spec) {
  const role = spec.role || '';
  return !role.indexOf('axis') || !role.indexOf('legend') || !role.indexOf('title') ? role : spec.type === GroupMark ? ScopeRole : role || MarkRole;
}

function definition (spec) {
  return {
    marktype: spec.type,
    name: spec.name || undefined,
    role: spec.role || getRole(spec),
    zindex: +spec.zindex || undefined,
    aria: spec.aria,
    description: spec.description
  };
}

function interactive (spec, scope) {
  return spec && spec.signal ? scope.signalRef(spec.signal) : spec === false ? false : true;
}

/**
 * Parse a data transform specification.
 */
function parseTransform (spec, scope) {
  const def = definition$1(spec.type);
  if (!def) error('Unrecognized transform type: ' + stringValue(spec.type));
  const t = entry(def.type.toLowerCase(), null, parseParameters(def, spec, scope));
  if (spec.signal) scope.addSignal(spec.signal, scope.proxy(t));
  t.metadata = def.metadata || {};
  return t;
}

/**
 * Parse all parameters of a data transform.
 */
function parseParameters(def, spec, scope) {
  const params = {},
    n = def.params.length;
  for (let i = 0; i < n; ++i) {
    const pdef = def.params[i];
    params[pdef.name] = parseParameter(pdef, spec, scope);
  }
  return params;
}

/**
 * Parse a data transform parameter.
 */
function parseParameter(def, spec, scope) {
  const type = def.type,
    value = spec[def.name];
  if (type === 'index') {
    return parseIndexParameter(def, spec, scope);
  } else if (value === undefined) {
    if (def.required) {
      error('Missing required ' + stringValue(spec.type) + ' parameter: ' + stringValue(def.name));
    }
    return;
  } else if (type === 'param') {
    return parseSubParameters(def, spec, scope);
  } else if (type === 'projection') {
    return scope.projectionRef(spec[def.name]);
  }
  return def.array && !isSignal(value) ? value.map(v => parameterValue(def, v, scope)) : parameterValue(def, value, scope);
}

/**
 * Parse a single parameter value.
 */
function parameterValue(def, value, scope) {
  const type = def.type;
  if (isSignal(value)) {
    return isExpr(type) ? error('Expression references can not be signals.') : isField(type) ? scope.fieldRef(value) : isCompare(type) ? scope.compareRef(value) : scope.signalRef(value.signal);
  } else {
    const expr = def.expr || isField(type);
    return expr && outerExpr(value) ? scope.exprRef(value.expr, value.as) : expr && outerField(value) ? fieldRef$1(value.field, value.as) : isExpr(type) ? parseExpression(value, scope) : isData(type) ? ref(scope.getData(value).values) : isField(type) ? fieldRef$1(value) : isCompare(type) ? scope.compareRef(value) : value;
  }
}

/**
 * Parse parameter for accessing an index of another data set.
 */
function parseIndexParameter(def, spec, scope) {
  if (!isString(spec.from)) {
    error('Lookup "from" parameter must be a string literal.');
  }
  return scope.getData(spec.from).lookupRef(scope, spec.key);
}

/**
 * Parse a parameter that contains one or more sub-parameter objects.
 */
function parseSubParameters(def, spec, scope) {
  const value = spec[def.name];
  if (def.array) {
    if (!isArray(value)) {
      // signals not allowed!
      error('Expected an array of sub-parameters. Instead: ' + stringValue(value));
    }
    return value.map(v => parseSubParameter(def, v, scope));
  } else {
    return parseSubParameter(def, value, scope);
  }
}

/**
 * Parse a sub-parameter object.
 */
function parseSubParameter(def, value, scope) {
  const n = def.params.length;
  let pdef;

  // loop over defs to find matching key
  for (let i = 0; i < n; ++i) {
    pdef = def.params[i];
    for (const k in pdef.key) {
      if (pdef.key[k] !== value[k]) {
        pdef = null;
        break;
      }
    }
    if (pdef) break;
  }
  // raise error if matching key not found
  if (!pdef) error('Unsupported parameter: ' + stringValue(value));

  // parse params, create Params transform, return ref
  const params = extend(parseParameters(pdef, value, scope), pdef.key);
  return ref(scope.add(Params(params)));
}

// -- Utilities -----

const outerExpr = _ => _ && _.expr;
const outerField = _ => _ && _.field;
const isData = _ => _ === 'data';
const isExpr = _ => _ === 'expr';
const isField = _ => _ === 'field';
const isCompare = _ => _ === 'compare';

function parseData$1 (from, group, scope) {
  let facet, key, op, dataRef, parent;

  // if no source data, generate singleton datum
  if (!from) {
    dataRef = ref(scope.add(Collect(null, [{}])));
  }

  // if faceted, process facet specification
  else if (facet = from.facet) {
    if (!group) error('Only group marks can be faceted.');

    // use pre-faceted source data, if available
    if (facet.field != null) {
      dataRef = parent = getDataRef(facet, scope);
    } else {
      // generate facet aggregates if no direct data specification
      if (!from.data) {
        op = parseTransform(extend({
          type: 'aggregate',
          groupby: array(facet.groupby)
        }, facet.aggregate), scope);
        op.params.key = scope.keyRef(facet.groupby);
        op.params.pulse = getDataRef(facet, scope);
        dataRef = parent = ref(scope.add(op));
      } else {
        parent = ref(scope.getData(from.data).aggregate);
      }
      key = scope.keyRef(facet.groupby, true);
    }
  }

  // if not yet defined, get source data reference
  if (!dataRef) {
    dataRef = getDataRef(from, scope);
  }
  return {
    key: key,
    pulse: dataRef,
    parent: parent
  };
}
function getDataRef(from, scope) {
  return from.$ref ? from : from.data && from.data.$ref ? from.data : ref(scope.getData(from.data).output);
}

function DataScope(scope, input, output, values, aggr) {
  this.scope = scope; // parent scope object
  this.input = input; // first operator in pipeline (tuple input)
  this.output = output; // last operator in pipeline (tuple output)
  this.values = values; // operator for accessing tuples (but not tuple flow)

  // last aggregate in transform pipeline
  this.aggregate = aggr;

  // lookup table of field indices
  this.index = {};
}
DataScope.fromEntries = function (scope, entries) {
  const n = entries.length,
    values = entries[n - 1],
    output = entries[n - 2];
  let input = entries[0],
    aggr = null,
    i = 1;
  if (input && input.type === 'load') {
    input = entries[1];
  }

  // add operator entries to this scope, wire up pulse chain
  scope.add(entries[0]);
  for (; i < n; ++i) {
    entries[i].params.pulse = ref(entries[i - 1]);
    scope.add(entries[i]);
    if (entries[i].type === 'aggregate') aggr = entries[i];
  }
  return new DataScope(scope, input, output, values, aggr);
};
function fieldKey(field) {
  return isString(field) ? field : null;
}
function addSortField(scope, p, sort) {
  const as = aggrField(sort.op, sort.field);
  let s;
  if (p.ops) {
    for (let i = 0, n = p.as.length; i < n; ++i) {
      if (p.as[i] === as) return;
    }
  } else {
    p.ops = ['count'];
    p.fields = [null];
    p.as = ['count'];
  }
  if (sort.op) {
    p.ops.push((s = sort.op.signal) ? scope.signalRef(s) : sort.op);
    p.fields.push(scope.fieldRef(sort.field));
    p.as.push(as);
  }
}
function cache(scope, ds, name, optype, field, counts, index) {
  const cache = ds[name] || (ds[name] = {}),
    sort = sortKey(counts);
  let k = fieldKey(field),
    v,
    op;
  if (k != null) {
    scope = ds.scope;
    k = k + (sort ? '|' + sort : '');
    v = cache[k];
  }
  if (!v) {
    const params = counts ? {
      field: keyFieldRef,
      pulse: ds.countsRef(scope, field, counts)
    } : {
      field: scope.fieldRef(field),
      pulse: ref(ds.output)
    };
    if (sort) params.sort = scope.sortRef(counts);
    op = scope.add(entry(optype, undefined, params));
    if (index) ds.index[field] = op;
    v = ref(op);
    if (k != null) cache[k] = v;
  }
  return v;
}
DataScope.prototype = {
  countsRef(scope, field, sort) {
    const ds = this,
      cache = ds.counts || (ds.counts = {}),
      k = fieldKey(field);
    let v, a, p;
    if (k != null) {
      scope = ds.scope;
      v = cache[k];
    }
    if (!v) {
      p = {
        groupby: scope.fieldRef(field, 'key'),
        pulse: ref(ds.output)
      };
      if (sort && sort.field) addSortField(scope, p, sort);
      a = scope.add(Aggregate(p));
      v = scope.add(Collect({
        pulse: ref(a)
      }));
      v = {
        agg: a,
        ref: ref(v)
      };
      if (k != null) cache[k] = v;
    } else if (sort && sort.field) {
      addSortField(scope, v.agg.params, sort);
    }
    return v.ref;
  },
  tuplesRef() {
    return ref(this.values);
  },
  extentRef(scope, field) {
    return cache(scope, this, 'extent', 'extent', field, false);
  },
  domainRef(scope, field) {
    return cache(scope, this, 'domain', 'values', field, false);
  },
  valuesRef(scope, field, sort) {
    return cache(scope, this, 'vals', 'values', field, sort || true);
  },
  lookupRef(scope, field) {
    return cache(scope, this, 'lookup', 'tupleindex', field, false);
  },
  indataRef(scope, field) {
    return cache(scope, this, 'indata', 'tupleindex', field, true, true);
  }
};

function parseFacet (spec, scope, group) {
  const facet = spec.from.facet,
    name = facet.name,
    data = getDataRef(facet, scope);
  let op;
  if (!facet.name) {
    error('Facet must have a name: ' + stringValue(facet));
  }
  if (!facet.data) {
    error('Facet must reference a data set: ' + stringValue(facet));
  }
  if (facet.field) {
    op = scope.add(PreFacet({
      field: scope.fieldRef(facet.field),
      pulse: data
    }));
  } else if (facet.groupby) {
    op = scope.add(Facet({
      key: scope.keyRef(facet.groupby),
      group: ref(scope.proxy(group.parent)),
      pulse: data
    }));
  } else {
    error('Facet must specify groupby or field: ' + stringValue(facet));
  }

  // initialize facet subscope
  const subscope = scope.fork(),
    source = subscope.add(Collect()),
    values = subscope.add(Sieve({
      pulse: ref(source)
    }));
  subscope.addData(name, new DataScope(subscope, source, source, values));
  subscope.addSignal('parent', null);

  // parse faceted subflow
  op.params.subflow = {
    $subflow: subscope.parse(spec).toRuntime()
  };
}

function parseSubflow (spec, scope, input) {
  const op = scope.add(PreFacet({
      pulse: input.pulse
    })),
    subscope = scope.fork();
  subscope.add(Sieve());
  subscope.addSignal('parent', null);

  // parse group mark subflow
  op.params.subflow = {
    $subflow: subscope.parse(spec).toRuntime()
  };
}

function parseTrigger (spec, scope, name) {
  const remove = spec.remove,
    insert = spec.insert,
    toggle = spec.toggle,
    modify = spec.modify,
    values = spec.values,
    op = scope.add(operator());
  const update = 'if(' + spec.trigger + ',modify("' + name + '",' + [insert, remove, toggle, modify, values].map(_ => _ == null ? 'null' : _).join(',') + '),0)';
  const expr = parseExpression(update, scope);
  op.update = expr.$expr;
  op.params = expr.$params;
}

function parseMark (spec, scope) {
  const role = getRole(spec),
    group = spec.type === GroupMark,
    facet = spec.from && spec.from.facet,
    overlap = spec.overlap;
  let layout = spec.layout || role === ScopeRole || role === FrameRole,
    ops,
    op,
    store,
    enc,
    name,
    layoutRef,
    boundRef;
  const nested = role === MarkRole || layout || facet;

  // resolve input data
  const input = parseData$1(spec.from, group, scope);

  // data join to map tuples to visual items
  op = scope.add(DataJoin({
    key: input.key || (spec.key ? fieldRef$1(spec.key) : undefined),
    pulse: input.pulse,
    clean: !group
  }));
  const joinRef = ref(op);

  // collect visual items
  op = store = scope.add(Collect({
    pulse: joinRef
  }));

  // connect visual items to scenegraph
  op = scope.add(Mark({
    markdef: definition(spec),
    interactive: interactive(spec.interactive, scope),
    clip: clip(spec.clip, scope),
    context: {
      $context: true
    },
    groups: scope.lookup(),
    parent: scope.signals.parent ? scope.signalRef('parent') : null,
    index: scope.markpath(),
    pulse: ref(op)
  }));
  const markRef = ref(op);

  // add visual encoders
  op = enc = scope.add(Encode(parseEncode(spec.encode, spec.type, role, spec.style, scope, {
    mod: false,
    pulse: markRef
  })));

  // monitor parent marks to propagate changes
  op.params.parent = scope.encode();

  // add post-encoding transforms, if defined
  if (spec.transform) {
    spec.transform.forEach(_ => {
      const tx = parseTransform(_, scope),
        md = tx.metadata;
      if (md.generates || md.changes) {
        error('Mark transforms should not generate new data.');
      }
      if (!md.nomod) enc.params.mod = true; // update encode mod handling
      tx.params.pulse = ref(op);
      scope.add(op = tx);
    });
  }

  // if item sort specified, perform post-encoding
  if (spec.sort) {
    op = scope.add(SortItems({
      sort: scope.compareRef(spec.sort),
      pulse: ref(op)
    }));
  }
  const encodeRef = ref(op);

  // add view layout operator if needed
  if (facet || layout) {
    layout = scope.add(ViewLayout({
      layout: scope.objectProperty(spec.layout),
      legends: scope.legends,
      mark: markRef,
      pulse: encodeRef
    }));
    layoutRef = ref(layout);
  }

  // compute bounding boxes
  const bound = scope.add(Bound({
    mark: markRef,
    pulse: layoutRef || encodeRef
  }));
  boundRef = ref(bound);

  // if group mark, recurse to parse nested content
  if (group) {
    // juggle layout & bounds to ensure they run *after* any faceting transforms
    if (nested) {
      ops = scope.operators;
      ops.pop();
      if (layout) ops.pop();
    }
    scope.pushState(encodeRef, layoutRef || boundRef, joinRef);
    facet ? parseFacet(spec, scope, input) // explicit facet
    : nested ? parseSubflow(spec, scope, input) // standard mark group
    : scope.parse(spec); // guide group, we can avoid nested scopes
    scope.popState();
    if (nested) {
      if (layout) ops.push(layout);
      ops.push(bound);
    }
  }

  // if requested, add overlap removal transform
  if (overlap) {
    boundRef = parseOverlap(overlap, boundRef, scope);
  }

  // render / sieve items
  const render = scope.add(Render({
      pulse: boundRef
    })),
    sieve = scope.add(Sieve({
      pulse: ref(render)
    }, undefined, scope.parent()));

  // if mark is named, make accessible as reactive geometry
  // add trigger updates if defined
  if (spec.name != null) {
    name = spec.name;
    scope.addData(name, new DataScope(scope, store, render, sieve));
    if (spec.on) spec.on.forEach(on => {
      if (on.insert || on.remove || on.toggle) {
        error('Marks only support modify triggers.');
      }
      parseTrigger(on, scope, name);
    });
  }
}
function parseOverlap(overlap, source, scope) {
  const method = overlap.method,
    bound = overlap.bound,
    sep = overlap.separation;
  const params = {
    separation: isSignal(sep) ? scope.signalRef(sep.signal) : sep,
    method: isSignal(method) ? scope.signalRef(method.signal) : method,
    pulse: source
  };
  if (overlap.order) {
    params.sort = scope.compareRef({
      field: overlap.order
    });
  }
  if (bound) {
    const tol = bound.tolerance;
    params.boundTolerance = isSignal(tol) ? scope.signalRef(tol.signal) : +tol;
    params.boundScale = scope.scaleRef(bound.scale);
    params.boundOrient = bound.orient;
  }
  return ref(scope.add(Overlap(params)));
}

function parseLegend (spec, scope) {
  const config = scope.config.legend,
    encode = spec.encode || {},
    _ = lookup(spec, config),
    legendEncode = encode.legend || {},
    name = legendEncode.name || undefined,
    interactive = legendEncode.interactive,
    style = legendEncode.style,
    scales = {};
  let scale = 0,
    entryLayout,
    params,
    children;

  // resolve scales and 'canonical' scale name
  LegendScales.forEach(s => spec[s] ? (scales[s] = spec[s], scale = scale || spec[s]) : 0);
  if (!scale) error('Missing valid scale for legend.');

  // resolve legend type (symbol, gradient, or discrete gradient)
  const type = legendType(spec, scope.scaleType(scale));

  // single-element data source for legend group
  const datum = {
    title: spec.title != null,
    scales: scales,
    type: type,
    vgrad: type !== 'symbol' && _.isVertical()
  };
  const dataRef = ref(scope.add(Collect(null, [datum])));

  // encoding properties for legend entry sub-group
  const entryEncode = {
    enter: {
      x: {
        value: 0
      },
      y: {
        value: 0
      }
    }
  };

  // data source for legend values
  const entryRef = ref(scope.add(LegendEntries(params = {
    type: type,
    scale: scope.scaleRef(scale),
    count: scope.objectProperty(_('tickCount')),
    limit: scope.property(_('symbolLimit')),
    values: scope.objectProperty(spec.values),
    minstep: scope.property(spec.tickMinStep),
    formatType: scope.property(spec.formatType),
    formatSpecifier: scope.property(spec.format)
  })));

  // continuous gradient legend
  if (type === Gradient) {
    children = [legendGradient(spec, scale, config, encode.gradient), legendGradientLabels(spec, config, encode.labels, entryRef)];
    // adjust default tick count based on the gradient length
    params.count = params.count || scope.signalRef(`max(2,2*floor((${deref(_.gradientLength())})/100))`);
  }

  // discrete gradient legend
  else if (type === Discrete) {
    children = [legendGradientDiscrete(spec, scale, config, encode.gradient, entryRef), legendGradientLabels(spec, config, encode.labels, entryRef)];
  }

  // symbol legend
  else {
    // determine legend symbol group layout
    entryLayout = legendSymbolLayout(spec, config);
    children = [legendSymbolGroups(spec, config, encode, entryRef, deref(entryLayout.columns))];
    // pass symbol size information to legend entry generator
    params.size = sizeExpression(spec, scope, children[0].marks);
  }

  // generate legend marks
  children = [guideGroup({
    role: LegendEntryRole,
    from: dataRef,
    encode: entryEncode,
    marks: children,
    layout: entryLayout,
    interactive
  })];

  // include legend title if defined
  if (datum.title) {
    children.push(legendTitle(spec, config, encode.title, dataRef));
  }

  // parse legend specification
  return parseMark(guideGroup({
    role: LegendRole,
    from: dataRef,
    encode: extendEncode(buildLegendEncode(_, spec, config), legendEncode, Skip),
    marks: children,
    aria: _('aria'),
    description: _('description'),
    zindex: _('zindex'),
    name,
    interactive,
    style
  }), scope);
}
function legendType(spec, scaleType) {
  let type = spec.type || Symbols;
  if (!spec.type && scaleCount(spec) === 1 && (spec.fill || spec.stroke)) {
    type = isContinuous(scaleType) ? Gradient : isDiscretizing(scaleType) ? Discrete : Symbols;
  }
  return type !== Gradient ? type : isDiscretizing(scaleType) ? Discrete : Gradient;
}
function scaleCount(spec) {
  return LegendScales.reduce((count, type) => count + (spec[type] ? 1 : 0), 0);
}
function buildLegendEncode(_, spec, config) {
  const encode = {
    enter: {},
    update: {}
  };
  addEncoders(encode, {
    orient: _('orient'),
    offset: _('offset'),
    padding: _('padding'),
    titlePadding: _('titlePadding'),
    cornerRadius: _('cornerRadius'),
    fill: _('fillColor'),
    stroke: _('strokeColor'),
    strokeWidth: config.strokeWidth,
    strokeDash: config.strokeDash,
    x: _('legendX'),
    y: _('legendY'),
    // accessibility support
    format: spec.format,
    formatType: spec.formatType
  });
  return encode;
}
function sizeExpression(spec, scope, marks) {
  const size = deref(getChannel('size', spec, marks)),
    strokeWidth = deref(getChannel('strokeWidth', spec, marks)),
    fontSize = deref(getFontSize(marks[1].encode, scope, GuideLabelStyle));
  return parseExpression(`max(ceil(sqrt(${size})+${strokeWidth}),${fontSize})`, scope);
}
function getChannel(name, spec, marks) {
  return spec[name] ? `scale("${spec[name]}",datum)` : getEncoding(name, marks[0].encode);
}
function getFontSize(encode, scope, style) {
  return getEncoding('fontSize', encode) || getStyle('fontSize', scope, style);
}

const angleExpr = `item.orient==="${Left}"?-90:item.orient==="${Right}"?90:0`;
function parseTitle (spec, scope) {
  spec = isString(spec) ? {
    text: spec
  } : spec;
  const _ = lookup(spec, scope.config.title),
    encode = spec.encode || {},
    userEncode = encode.group || {},
    name = userEncode.name || undefined,
    interactive = userEncode.interactive,
    style = userEncode.style,
    children = [];

  // single-element data source for group title
  const datum = {},
    dataRef = ref(scope.add(Collect(null, [datum])));

  // include title text
  children.push(buildTitle(spec, _, titleEncode(spec), dataRef));

  // include subtitle text
  if (spec.subtitle) {
    children.push(buildSubTitle(spec, _, encode.subtitle, dataRef));
  }

  // parse title specification
  return parseMark(guideGroup({
    role: TitleRole,
    from: dataRef,
    encode: groupEncode(_, userEncode),
    marks: children,
    aria: _('aria'),
    description: _('description'),
    zindex: _('zindex'),
    name,
    interactive,
    style
  }), scope);
}

// provide backwards-compatibility for title custom encode;
// the top-level encode block has been *deprecated*.
function titleEncode(spec) {
  const encode = spec.encode;
  return encode && encode.title || extend({
    name: spec.name,
    interactive: spec.interactive,
    style: spec.style
  }, encode);
}
function groupEncode(_, userEncode) {
  const encode = {
    enter: {},
    update: {}
  };
  addEncoders(encode, {
    orient: _('orient'),
    anchor: _('anchor'),
    align: {
      signal: alignExpr$1
    },
    angle: {
      signal: angleExpr
    },
    limit: _('limit'),
    frame: _('frame'),
    offset: _('offset') || 0,
    padding: _('subtitlePadding')
  });
  return extendEncode(encode, userEncode, Skip);
}
function buildTitle(spec, _, userEncode, dataRef) {
  const zero = {
      value: 0
    },
    text = spec.text,
    encode = {
      enter: {
        opacity: zero
      },
      update: {
        opacity: {
          value: 1
        }
      },
      exit: {
        opacity: zero
      }
    };
  addEncoders(encode, {
    text: text,
    align: {
      signal: 'item.mark.group.align'
    },
    angle: {
      signal: 'item.mark.group.angle'
    },
    limit: {
      signal: 'item.mark.group.limit'
    },
    baseline: 'top',
    dx: _('dx'),
    dy: _('dy'),
    fill: _('color'),
    font: _('font'),
    fontSize: _('fontSize'),
    fontStyle: _('fontStyle'),
    fontWeight: _('fontWeight'),
    lineHeight: _('lineHeight')
  }, {
    // update
    align: _('align'),
    angle: _('angle'),
    baseline: _('baseline')
  });
  return guideMark({
    type: TextMark,
    role: TitleTextRole,
    style: GroupTitleStyle,
    from: dataRef,
    encode
  }, userEncode);
}
function buildSubTitle(spec, _, userEncode, dataRef) {
  const zero = {
      value: 0
    },
    text = spec.subtitle,
    encode = {
      enter: {
        opacity: zero
      },
      update: {
        opacity: {
          value: 1
        }
      },
      exit: {
        opacity: zero
      }
    };
  addEncoders(encode, {
    text: text,
    align: {
      signal: 'item.mark.group.align'
    },
    angle: {
      signal: 'item.mark.group.angle'
    },
    limit: {
      signal: 'item.mark.group.limit'
    },
    baseline: 'top',
    dx: _('dx'),
    dy: _('dy'),
    fill: _('subtitleColor'),
    font: _('subtitleFont'),
    fontSize: _('subtitleFontSize'),
    fontStyle: _('subtitleFontStyle'),
    fontWeight: _('subtitleFontWeight'),
    lineHeight: _('subtitleLineHeight')
  }, {
    // update
    align: _('align'),
    angle: _('angle'),
    baseline: _('baseline')
  });
  return guideMark({
    type: TextMark,
    role: TitleSubtitleRole,
    style: GroupSubtitleStyle,
    from: dataRef,
    encode
  }, userEncode);
}

function parseData(data, scope) {
  const transforms = [];
  if (data.transform) {
    data.transform.forEach(tx => {
      transforms.push(parseTransform(tx, scope));
    });
  }
  if (data.on) {
    data.on.forEach(on => {
      parseTrigger(on, scope, data.name);
    });
  }
  scope.addDataPipeline(data.name, analyze(data, scope, transforms));
}

/**
 * Analyze a data pipeline, add needed operators.
 */
function analyze(data, scope, ops) {
  const output = [];
  let source = null,
    modify = false,
    generate = false,
    upstream,
    i,
    n,
    t,
    m;
  if (data.values) {
    // hard-wired input data set
    if (isSignal(data.values) || hasSignal(data.format)) {
      // if either values is signal or format has signal, use dynamic loader
      output.push(load(scope, data));
      output.push(source = collect());
    } else {
      // otherwise, ingest upon dataflow init
      output.push(source = collect({
        $ingest: data.values,
        $format: data.format
      }));
    }
  } else if (data.url) {
    // load data from external source
    if (hasSignal(data.url) || hasSignal(data.format)) {
      // if either url or format has signal, use dynamic loader
      output.push(load(scope, data));
      output.push(source = collect());
    } else {
      // otherwise, request load upon dataflow init
      output.push(source = collect({
        $request: data.url,
        $format: data.format
      }));
    }
  } else if (data.source) {
    // derives from one or more other data sets
    source = upstream = array(data.source).map(d => ref(scope.getData(d).output));
    output.push(null); // populate later
  }

  // scan data transforms, add collectors as needed
  for (i = 0, n = ops.length; i < n; ++i) {
    t = ops[i];
    m = t.metadata;
    if (!source && !m.source) {
      output.push(source = collect());
    }
    output.push(t);
    if (m.generates) generate = true;
    if (m.modifies && !generate) modify = true;
    if (m.source) source = t;else if (m.changes) source = null;
  }
  if (upstream) {
    n = upstream.length - 1;
    output[0] = Relay({
      derive: modify,
      pulse: n ? upstream : upstream[0]
    });
    if (modify || n) {
      // collect derived and multi-pulse tuples
      output.splice(1, 0, collect());
    }
  }
  if (!source) output.push(collect());
  output.push(Sieve({}));
  return output;
}
function collect(values) {
  const s = Collect({}, values);
  s.metadata = {
    source: true
  };
  return s;
}
function load(scope, data) {
  return Load({
    url: data.url ? scope.property(data.url) : undefined,
    async: data.async ? scope.property(data.async) : undefined,
    values: data.values ? scope.property(data.values) : undefined,
    format: scope.objectProperty(data.format)
  });
}

const isX = orient => orient === Bottom || orient === Top;

// get sign coefficient based on axis orient
const getSign = (orient, a, b) => isSignal(orient) ? ifLeftTopExpr(orient.signal, a, b) : orient === Left || orient === Top ? a : b;

// condition on axis x-direction
const ifX = (orient, a, b) => isSignal(orient) ? ifXEnc(orient.signal, a, b) : isX(orient) ? a : b;

// condition on axis y-direction
const ifY = (orient, a, b) => isSignal(orient) ? ifYEnc(orient.signal, a, b) : isX(orient) ? b : a;
const ifTop = (orient, a, b) => isSignal(orient) ? ifTopExpr(orient.signal, a, b) : orient === Top ? {
  value: a
} : {
  value: b
};
const ifRight = (orient, a, b) => isSignal(orient) ? ifRightExpr(orient.signal, a, b) : orient === Right ? {
  value: a
} : {
  value: b
};
const ifXEnc = ($orient, a, b) => ifEnc(`${$orient} === '${Top}' || ${$orient} === '${Bottom}'`, a, b);
const ifYEnc = ($orient, a, b) => ifEnc(`${$orient} !== '${Top}' && ${$orient} !== '${Bottom}'`, a, b);
const ifLeftTopExpr = ($orient, a, b) => ifExpr(`${$orient} === '${Left}' || ${$orient} === '${Top}'`, a, b);
const ifTopExpr = ($orient, a, b) => ifExpr(`${$orient} === '${Top}'`, a, b);
const ifRightExpr = ($orient, a, b) => ifExpr(`${$orient} === '${Right}'`, a, b);
const ifEnc = (test, a, b) => {
  // ensure inputs are encoder objects (or null)
  a = a != null ? encoder(a) : a;
  b = b != null ? encoder(b) : b;
  if (isSimple(a) && isSimple(b)) {
    // if possible generate simple signal expression
    a = a ? a.signal || stringValue(a.value) : null;
    b = b ? b.signal || stringValue(b.value) : null;
    return {
      signal: `${test} ? (${a}) : (${b})`
    };
  } else {
    // otherwise generate rule set
    return [extend({
      test
    }, a)].concat(b || []);
  }
};
const isSimple = enc => enc == null || Object.keys(enc).length === 1;
const ifExpr = (test, a, b) => ({
  signal: `${test} ? (${toExpr(a)}) : (${toExpr(b)})`
});
const ifOrient = ($orient, t, b, l, r) => ({
  signal: (l != null ? `${$orient} === '${Left}' ? (${toExpr(l)}) : ` : '') + (b != null ? `${$orient} === '${Bottom}' ? (${toExpr(b)}) : ` : '') + (r != null ? `${$orient} === '${Right}' ? (${toExpr(r)}) : ` : '') + (t != null ? `${$orient} === '${Top}' ? (${toExpr(t)}) : ` : '') + '(null)'
});
const toExpr = v => isSignal(v) ? v.signal : v == null ? null : stringValue(v);
const mult = (sign, value) => value === 0 ? 0 : isSignal(sign) ? {
  signal: `(${sign.signal}) * ${value}`
} : {
  value: sign * value
};
const patch = (value, base) => {
  const s = value.signal;
  return s && s.endsWith('(null)') ? {
    signal: s.slice(0, -6) + base.signal
  } : value;
};

function fallback(prop, config, axisConfig, style) {
  let styleProp;
  if (config && hasOwnProperty(config, prop)) {
    return config[prop];
  } else if (hasOwnProperty(axisConfig, prop)) {
    return axisConfig[prop];
  } else if (prop.startsWith('title')) {
    switch (prop) {
      case 'titleColor':
        styleProp = 'fill';
        break;
      case 'titleFont':
      case 'titleFontSize':
      case 'titleFontWeight':
        styleProp = prop[5].toLowerCase() + prop.slice(6);
    }
    return style[GuideTitleStyle][styleProp];
  } else if (prop.startsWith('label')) {
    switch (prop) {
      case 'labelColor':
        styleProp = 'fill';
        break;
      case 'labelFont':
      case 'labelFontSize':
        styleProp = prop[5].toLowerCase() + prop.slice(6);
    }
    return style[GuideLabelStyle][styleProp];
  }
  return null;
}
function keys(objects) {
  const map = {};
  for (const obj of objects) {
    if (!obj) continue;
    for (const key in obj) map[key] = 1;
  }
  return Object.keys(map);
}
function axisConfig (spec, scope) {
  var config = scope.config,
    style = config.style,
    axis = config.axis,
    band = scope.scaleType(spec.scale) === 'band' && config.axisBand,
    orient = spec.orient,
    xy,
    or,
    key;
  if (isSignal(orient)) {
    const xyKeys = keys([config.axisX, config.axisY]),
      orientKeys = keys([config.axisTop, config.axisBottom, config.axisLeft, config.axisRight]);
    xy = {};
    for (key of xyKeys) {
      xy[key] = ifX(orient, fallback(key, config.axisX, axis, style), fallback(key, config.axisY, axis, style));
    }
    or = {};
    for (key of orientKeys) {
      or[key] = ifOrient(orient.signal, fallback(key, config.axisTop, axis, style), fallback(key, config.axisBottom, axis, style), fallback(key, config.axisLeft, axis, style), fallback(key, config.axisRight, axis, style));
    }
  } else {
    xy = orient === Top || orient === Bottom ? config.axisX : config.axisY;
    or = config['axis' + orient[0].toUpperCase() + orient.slice(1)];
  }
  const result = xy || or || band ? extend({}, axis, xy, or, band) : axis;
  return result;
}

function axisDomain (spec, config, userEncode, dataRef) {
  const _ = lookup(spec, config),
    orient = spec.orient;
  let enter, update;
  const encode = {
    enter: enter = {
      opacity: zero
    },
    update: update = {
      opacity: one
    },
    exit: {
      opacity: zero
    }
  };
  addEncoders(encode, {
    stroke: _('domainColor'),
    strokeCap: _('domainCap'),
    strokeDash: _('domainDash'),
    strokeDashOffset: _('domainDashOffset'),
    strokeWidth: _('domainWidth'),
    strokeOpacity: _('domainOpacity')
  });
  const pos0 = position(spec, 0);
  const pos1 = position(spec, 1);
  enter.x = update.x = ifX(orient, pos0, zero);
  enter.x2 = update.x2 = ifX(orient, pos1);
  enter.y = update.y = ifY(orient, pos0, zero);
  enter.y2 = update.y2 = ifY(orient, pos1);
  return guideMark({
    type: RuleMark,
    role: AxisDomainRole,
    from: dataRef,
    encode
  }, userEncode);
}
function position(spec, pos) {
  return {
    scale: spec.scale,
    range: pos
  };
}

function axisGrid (spec, config, userEncode, dataRef, band) {
  const _ = lookup(spec, config),
    orient = spec.orient,
    vscale = spec.gridScale,
    sign = getSign(orient, 1, -1),
    offset = offsetValue(spec.offset, sign);
  let enter, exit, update;
  const encode = {
    enter: enter = {
      opacity: zero
    },
    update: update = {
      opacity: one
    },
    exit: exit = {
      opacity: zero
    }
  };
  addEncoders(encode, {
    stroke: _('gridColor'),
    strokeCap: _('gridCap'),
    strokeDash: _('gridDash'),
    strokeDashOffset: _('gridDashOffset'),
    strokeOpacity: _('gridOpacity'),
    strokeWidth: _('gridWidth')
  });
  const tickPos = {
    scale: spec.scale,
    field: Value,
    band: band.band,
    extra: band.extra,
    offset: band.offset,
    round: _('tickRound')
  };
  const sz = ifX(orient, {
    signal: 'height'
  }, {
    signal: 'width'
  });
  const gridStart = vscale ? {
    scale: vscale,
    range: 0,
    mult: sign,
    offset: offset
  } : {
    value: 0,
    offset: offset
  };
  const gridEnd = vscale ? {
    scale: vscale,
    range: 1,
    mult: sign,
    offset: offset
  } : extend(sz, {
    mult: sign,
    offset: offset
  });
  enter.x = update.x = ifX(orient, tickPos, gridStart);
  enter.y = update.y = ifY(orient, tickPos, gridStart);
  enter.x2 = update.x2 = ifY(orient, gridEnd);
  enter.y2 = update.y2 = ifX(orient, gridEnd);
  exit.x = ifX(orient, tickPos);
  exit.y = ifY(orient, tickPos);
  return guideMark({
    type: RuleMark,
    role: AxisGridRole,
    key: Value,
    from: dataRef,
    encode
  }, userEncode);
}
function offsetValue(offset, sign) {
  if (sign === 1) ; else if (!isObject(offset)) {
    offset = isSignal(sign) ? {
      signal: `(${sign.signal}) * (${offset || 0})`
    } : sign * (offset || 0);
  } else {
    let entry = offset = extend({}, offset);
    while (entry.mult != null) {
      if (!isObject(entry.mult)) {
        entry.mult = isSignal(sign) // no offset if sign === 1
        ? {
          signal: `(${entry.mult}) * (${sign.signal})`
        } : entry.mult * sign;
        return offset;
      } else {
        entry = entry.mult = extend({}, entry.mult);
      }
    }
    entry.mult = sign;
  }
  return offset;
}

function axisTicks (spec, config, userEncode, dataRef, size, band) {
  const _ = lookup(spec, config),
    orient = spec.orient,
    sign = getSign(orient, -1, 1);
  let enter, exit, update;
  const encode = {
    enter: enter = {
      opacity: zero
    },
    update: update = {
      opacity: one
    },
    exit: exit = {
      opacity: zero
    }
  };
  addEncoders(encode, {
    stroke: _('tickColor'),
    strokeCap: _('tickCap'),
    strokeDash: _('tickDash'),
    strokeDashOffset: _('tickDashOffset'),
    strokeOpacity: _('tickOpacity'),
    strokeWidth: _('tickWidth')
  });
  const tickSize = encoder(size);
  tickSize.mult = sign;
  const tickPos = {
    scale: spec.scale,
    field: Value,
    band: band.band,
    extra: band.extra,
    offset: band.offset,
    round: _('tickRound')
  };
  update.y = enter.y = ifX(orient, zero, tickPos);
  update.y2 = enter.y2 = ifX(orient, tickSize);
  exit.x = ifX(orient, tickPos);
  update.x = enter.x = ifY(orient, zero, tickPos);
  update.x2 = enter.x2 = ifY(orient, tickSize);
  exit.y = ifY(orient, tickPos);
  return guideMark({
    type: RuleMark,
    role: AxisTickRole,
    key: Value,
    from: dataRef,
    encode
  }, userEncode);
}

function flushExpr(scale, threshold, a, b, c) {
  return {
    signal: 'flush(range("' + scale + '"), ' + 'scale("' + scale + '", datum.value), ' + threshold + ',' + a + ',' + b + ',' + c + ')'
  };
}
function axisLabels (spec, config, userEncode, dataRef, size, band) {
  const _ = lookup(spec, config),
    orient = spec.orient,
    scale = spec.scale,
    sign = getSign(orient, -1, 1),
    flush = deref(_('labelFlush')),
    flushOffset = deref(_('labelFlushOffset')),
    labelAlign = _('labelAlign'),
    labelBaseline = _('labelBaseline');
  let flushOn = flush === 0 || !!flush,
    update;
  const tickSize = encoder(size);
  tickSize.mult = sign;
  tickSize.offset = encoder(_('labelPadding') || 0);
  tickSize.offset.mult = sign;
  const tickPos = {
    scale: scale,
    field: Value,
    band: 0.5,
    offset: extendOffset(band.offset, _('labelOffset'))
  };
  const align = ifX(orient, flushOn ? flushExpr(scale, flush, '"left"', '"right"', '"center"') : {
    value: 'center'
  }, ifRight(orient, 'left', 'right'));
  const baseline = ifX(orient, ifTop(orient, 'bottom', 'top'), flushOn ? flushExpr(scale, flush, '"top"', '"bottom"', '"middle"') : {
    value: 'middle'
  });
  const offsetExpr = flushExpr(scale, flush, `-(${flushOffset})`, flushOffset, 0);
  flushOn = flushOn && flushOffset;
  const enter = {
    opacity: zero,
    x: ifX(orient, tickPos, tickSize),
    y: ifY(orient, tickPos, tickSize)
  };
  const encode = {
    enter: enter,
    update: update = {
      opacity: one,
      text: {
        field: Label
      },
      x: enter.x,
      y: enter.y,
      align,
      baseline
    },
    exit: {
      opacity: zero,
      x: enter.x,
      y: enter.y
    }
  };
  addEncoders(encode, {
    dx: !labelAlign && flushOn ? ifX(orient, offsetExpr) : null,
    dy: !labelBaseline && flushOn ? ifY(orient, offsetExpr) : null
  });
  addEncoders(encode, {
    angle: _('labelAngle'),
    fill: _('labelColor'),
    fillOpacity: _('labelOpacity'),
    font: _('labelFont'),
    fontSize: _('labelFontSize'),
    fontWeight: _('labelFontWeight'),
    fontStyle: _('labelFontStyle'),
    limit: _('labelLimit'),
    lineHeight: _('labelLineHeight')
  }, {
    align: labelAlign,
    baseline: labelBaseline
  });
  const bound = _('labelBound');
  let overlap = _('labelOverlap');

  // if overlap method or bound defined, request label overlap removal
  overlap = overlap || bound ? {
    separation: _('labelSeparation'),
    method: overlap,
    order: 'datum.index',
    bound: bound ? {
      scale,
      orient,
      tolerance: bound
    } : null
  } : undefined;
  if (update.align !== align) {
    update.align = patch(update.align, align);
  }
  if (update.baseline !== baseline) {
    update.baseline = patch(update.baseline, baseline);
  }
  return guideMark({
    type: TextMark,
    role: AxisLabelRole,
    style: GuideLabelStyle,
    key: Value,
    from: dataRef,
    encode,
    overlap
  }, userEncode);
}

function axisTitle (spec, config, userEncode, dataRef) {
  const _ = lookup(spec, config),
    orient = spec.orient,
    sign = getSign(orient, -1, 1);
  let enter, update;
  const encode = {
    enter: enter = {
      opacity: zero,
      anchor: encoder(_('titleAnchor', null)),
      align: {
        signal: alignExpr$1
      }
    },
    update: update = extend({}, enter, {
      opacity: one,
      text: encoder(spec.title)
    }),
    exit: {
      opacity: zero
    }
  };
  const titlePos = {
    signal: `lerp(range("${spec.scale}"), ${anchorExpr(0, 1, 0.5)})`
  };
  update.x = ifX(orient, titlePos);
  update.y = ifY(orient, titlePos);
  enter.angle = ifX(orient, zero, mult(sign, 90));
  enter.baseline = ifX(orient, ifTop(orient, Bottom, Top), {
    value: Bottom
  });
  update.angle = enter.angle;
  update.baseline = enter.baseline;
  addEncoders(encode, {
    fill: _('titleColor'),
    fillOpacity: _('titleOpacity'),
    font: _('titleFont'),
    fontSize: _('titleFontSize'),
    fontStyle: _('titleFontStyle'),
    fontWeight: _('titleFontWeight'),
    limit: _('titleLimit'),
    lineHeight: _('titleLineHeight')
  }, {
    // require update
    align: _('titleAlign'),
    angle: _('titleAngle'),
    baseline: _('titleBaseline')
  });
  autoLayout(_, orient, encode, userEncode);
  encode.update.align = patch(encode.update.align, enter.align);
  encode.update.angle = patch(encode.update.angle, enter.angle);
  encode.update.baseline = patch(encode.update.baseline, enter.baseline);
  return guideMark({
    type: TextMark,
    role: AxisTitleRole,
    style: GuideTitleStyle,
    from: dataRef,
    encode
  }, userEncode);
}
function autoLayout(_, orient, encode, userEncode) {
  const auto = (value, dim) => value != null ? (encode.update[dim] = patch(encoder(value), encode.update[dim]), false) : !has(dim, userEncode) ? true : false;
  const autoY = auto(_('titleX'), 'x'),
    autoX = auto(_('titleY'), 'y');
  encode.enter.auto = autoX === autoY ? encoder(autoX) : ifX(orient, encoder(autoX), encoder(autoY));
}

function parseAxis (spec, scope) {
  const config = axisConfig(spec, scope),
    encode = spec.encode || {},
    axisEncode = encode.axis || {},
    name = axisEncode.name || undefined,
    interactive = axisEncode.interactive,
    style = axisEncode.style,
    _ = lookup(spec, config),
    band = tickBand(_);

  // single-element data source for axis group
  const datum = {
    scale: spec.scale,
    ticks: !!_('ticks'),
    labels: !!_('labels'),
    grid: !!_('grid'),
    domain: !!_('domain'),
    title: spec.title != null
  };
  const dataRef = ref(scope.add(Collect({}, [datum])));

  // data source for axis ticks
  const ticksRef = ref(scope.add(AxisTicks({
    scale: scope.scaleRef(spec.scale),
    extra: scope.property(band.extra),
    count: scope.objectProperty(spec.tickCount),
    values: scope.objectProperty(spec.values),
    minstep: scope.property(spec.tickMinStep),
    formatType: scope.property(spec.formatType),
    formatSpecifier: scope.property(spec.format)
  })));

  // generate axis marks
  const children = [];
  let size;

  // include axis gridlines if requested
  if (datum.grid) {
    children.push(axisGrid(spec, config, encode.grid, ticksRef, band));
  }

  // include axis ticks if requested
  if (datum.ticks) {
    size = _('tickSize');
    children.push(axisTicks(spec, config, encode.ticks, ticksRef, size, band));
  }

  // include axis labels if requested
  if (datum.labels) {
    size = datum.ticks ? size : 0;
    children.push(axisLabels(spec, config, encode.labels, ticksRef, size, band));
  }

  // include axis domain path if requested
  if (datum.domain) {
    children.push(axisDomain(spec, config, encode.domain, dataRef));
  }

  // include axis title if defined
  if (datum.title) {
    children.push(axisTitle(spec, config, encode.title, dataRef));
  }

  // parse axis specification
  return parseMark(guideGroup({
    role: AxisRole,
    from: dataRef,
    encode: extendEncode(buildAxisEncode(_, spec), axisEncode, Skip),
    marks: children,
    aria: _('aria'),
    description: _('description'),
    zindex: _('zindex'),
    name,
    interactive,
    style
  }), scope);
}
function buildAxisEncode(_, spec) {
  const encode = {
    enter: {},
    update: {}
  };
  addEncoders(encode, {
    orient: _('orient'),
    offset: _('offset') || 0,
    position: value(spec.position, 0),
    titlePadding: _('titlePadding'),
    minExtent: _('minExtent'),
    maxExtent: _('maxExtent'),
    range: {
      signal: `abs(span(range("${spec.scale}")))`
    },
    translate: _('translate'),
    // accessibility support
    format: spec.format,
    formatType: spec.formatType
  });
  return encode;
}

function parseScope (spec, scope, preprocessed) {
  const signals = array(spec.signals),
    scales = array(spec.scales);

  // parse signal definitions, if not already preprocessed
  if (!preprocessed) signals.forEach(_ => parseSignal(_, scope));

  // parse cartographic projection definitions
  array(spec.projections).forEach(_ => parseProjection(_, scope));

  // initialize scale references
  scales.forEach(_ => initScale(_, scope));

  // parse data sources
  array(spec.data).forEach(_ => parseData(_, scope));

  // parse scale definitions
  scales.forEach(_ => parseScale(_, scope));

  // parse signal updates
  (preprocessed || signals).forEach(_ => parseSignalUpdates(_, scope));

  // parse axis definitions
  array(spec.axes).forEach(_ => parseAxis(_, scope));

  // parse mark definitions
  array(spec.marks).forEach(_ => parseMark(_, scope));

  // parse legend definitions
  array(spec.legends).forEach(_ => parseLegend(_, scope));

  // parse title, if defined
  if (spec.title) parseTitle(spec.title, scope);

  // parse collected lambda (anonymous) expressions
  scope.parseLambdas();
  return scope;
}

const rootEncode = spec => extendEncode({
  enter: {
    x: {
      value: 0
    },
    y: {
      value: 0
    }
  },
  update: {
    width: {
      signal: 'width'
    },
    height: {
      signal: 'height'
    }
  }
}, spec);
function parseView(spec, scope) {
  const config = scope.config;

  // add scenegraph root
  const root = ref(scope.root = scope.add(operator()));

  // parse top-level signal definitions
  const signals = collectSignals(spec, config);
  signals.forEach(_ => parseSignal(_, scope));

  // assign description, event, legend, and locale configuration
  scope.description = spec.description || config.description;
  scope.eventConfig = config.events;
  scope.legends = scope.objectProperty(config.legend && config.legend.layout);
  scope.locale = config.locale;

  // store root group item
  const input = scope.add(Collect());

  // encode root group item
  const encode = scope.add(Encode(parseEncode(rootEncode(spec.encode), GroupMark, FrameRole, spec.style, scope, {
    pulse: ref(input)
  })));

  // perform view layout
  const parent = scope.add(ViewLayout({
    layout: scope.objectProperty(spec.layout),
    legends: scope.legends,
    autosize: scope.signalRef('autosize'),
    mark: root,
    pulse: ref(encode)
  }));
  scope.operators.pop();

  // parse remainder of specification
  scope.pushState(ref(encode), ref(parent), null);
  parseScope(spec, scope, signals);
  scope.operators.push(parent);

  // bound / render / sieve root item
  let op = scope.add(Bound({
    mark: root,
    pulse: ref(parent)
  }));
  op = scope.add(Render({
    pulse: ref(op)
  }));
  op = scope.add(Sieve({
    pulse: ref(op)
  }));

  // track metadata for root item
  scope.addData('root', new DataScope(scope, input, input, op));
  return scope;
}
function signalObject(name, value) {
  return value && value.signal ? {
    name,
    update: value.signal
  } : {
    name,
    value
  };
}

/**
 * Collect top-level signals, merging values as needed. Signals
 * defined in the config signals arrays are added only if that
 * signal is not explicitly defined in the specification.
 * Built-in signals (autosize, background, padding, width, height)
 * receive special treatment. They are initialized using the
 * top-level spec property, or, if undefined in the spec, using
 * the corresponding top-level config property. If this property
 * is a signal reference object, the signal expression maps to the
 * signal 'update' property. If the spec's top-level signal array
 * contains an entry that matches a built-in signal, that entry
 * will be merged with the built-in specification, potentially
 * overwriting existing 'value' or 'update' properties.
 */
function collectSignals(spec, config) {
  const _ = name => value(spec[name], config[name]),
    signals = [signalObject('background', _('background')), signalObject('autosize', parseAutosize(_('autosize'))), signalObject('padding', parsePadding(_('padding'))), signalObject('width', _('width') || 0), signalObject('height', _('height') || 0)],
    pre = signals.reduce((p, s) => (p[s.name] = s, p), {}),
    map = {};

  // add spec signal array
  array(spec.signals).forEach(s => {
    if (hasOwnProperty(pre, s.name)) {
      // merge if built-in signal
      s = extend(pre[s.name], s);
    } else {
      // otherwise add to signal list
      signals.push(s);
    }
    map[s.name] = s;
  });

  // add config signal array
  array(config.signals).forEach(s => {
    if (!hasOwnProperty(map, s.name) && !hasOwnProperty(pre, s.name)) {
      // add to signal list if not already defined
      signals.push(s);
    }
  });
  return signals;
}

function Scope(config, options) {
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
      operators: this.operators,
      streams: this.streams,
      updates: this.updates,
      bindings: this.bindings,
      eventConfig: this.eventConfig,
      locale: this.locale
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
      op.refs.forEach(ref => {
        ref.$ref = op.id;
      });
      op.refs = null;
    }
    return op;
  },
  proxy(op) {
    const vref = op instanceof Entry ? ref(op) : op;
    return this.add(Proxy({
      value: vref
    }));
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
      annotate(ds.input, name, 'input');
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
    this._encode.push(ref(this.add(Sieve({
      pulse: encode
    }))));
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
    return ++p[p.length - 1];
  },
  // ----

  fieldRef(field, name) {
    if (isString(field)) return fieldRef$1(field, name);
    if (!field.signal) {
      error('Unsupported field reference: ' + stringValue(field));
    }
    const s = field.signal;
    let f = this.field[s];
    if (!f) {
      const params = {
        name: this.signalRef(s)
      };
      if (name) params.as = name;
      this.field[s] = f = ref(this.add(Field(params)));
    }
    return f;
  },
  compareRef(cmp) {
    let signal = false;
    const check = _ => isSignal(_) ? (signal = true, this.signalRef(_.signal)) : isExpr$1(_) ? (signal = true, this.exprRef(_.expr)) : _;
    const fields = array(cmp.field).map(check),
      orders = array(cmp.order).map(check);
    return signal ? ref(this.add(Compare({
      fields: fields,
      orders: orders
    }))) : compareRef(fields, orders);
  },
  keyRef(fields, flat) {
    let signal = false;
    const check = _ => isSignal(_) ? (signal = true, ref(sig[_.signal])) : _;
    const sig = this.signals;
    fields = array(fields).map(check);
    return signal ? ref(this.add(Key({
      fields: fields,
      flat: flat
    }))) : keyRef(fields, flat);
  },
  sortRef(sort) {
    if (!sort) return sort;

    // including id ensures stable sorting
    const a = aggrField(sort.op, sort.field),
      o = sort.order || Ascending;
    return o.signal ? ref(this.add(Compare({
      fields: a,
      orders: this.signalRef(o.signal)
    }))) : compareRef(a, o);
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
    for (let i = 0, n = code.length; i < n; ++i) {
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
    return !spec || !isObject(spec) ? spec : this.signalRef(spec.signal || propertyLambda(spec));
  },
  exprRef(code, name) {
    const params = {
      expr: parseExpression(code, this)
    };
    if (name) params.expr.$name = name;
    return ref(this.add(Expression(params)));
  },
  addBinding(name, bind) {
    if (!this.bindings) {
      error('Nested signals do not support binding: ' + stringValue(name));
    }
    this.bindings.push(extend({
      signal: name
    }, bind));
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
    return this.data[name] = dataScope;
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
  for (let i = 0; i < n; ++i) {
    const value = array[i];
    code += (i > 0 ? ',' : '') + (isObject(value) ? value.signal || propertyLambda(value) : stringValue(value));
  }
  return code + ']';
}
function objectLambda(obj) {
  let code = '{',
    i = 0,
    key,
    value;
  for (key in obj) {
    value = obj[key];
    code += (++i > 1 ? ',' : '') + stringValue(key) + ':' + (isObject(value) ? value.signal || propertyLambda(value) : stringValue(value));
  }
  return code + '}';
}

/**
 * Standard configuration defaults for Vega specification parsing.
 * Users can provide their own (sub-)set of these default values
 * by passing in a config object to the top-level parse method.
 */
function defaults () {
  const defaultFont = 'sans-serif',
    defaultSymbolSize = 30,
    defaultStrokeWidth = 2,
    defaultColor = '#4c78a8',
    black = '#000',
    gray = '#888',
    lightGray = '#ddd';
  return {
    // default visualization description
    description: 'Vega visualization',
    // default padding around visualization
    padding: 0,
    // default for automatic sizing; options: 'none', 'pad', 'fit'
    // or provide an object (e.g., {'type': 'pad', 'resize': true})
    autosize: 'pad',
    // default view background color
    // covers the entire view component
    background: null,
    // default event handling configuration
    // preventDefault for view-sourced event types except 'wheel'
    events: {
      defaults: {
        allow: ['wheel']
      }
    },
    // defaults for top-level group marks
    // accepts mark properties (fill, stroke, etc)
    // covers the data rectangle within group width/height
    group: null,
    // defaults for basic mark types
    // each subset accepts mark properties (fill, stroke, etc)
    mark: null,
    arc: {
      fill: defaultColor
    },
    area: {
      fill: defaultColor
    },
    image: null,
    line: {
      stroke: defaultColor,
      strokeWidth: defaultStrokeWidth
    },
    path: {
      stroke: defaultColor
    },
    rect: {
      fill: defaultColor
    },
    rule: {
      stroke: black
    },
    shape: {
      stroke: defaultColor
    },
    symbol: {
      fill: defaultColor,
      size: 64
    },
    text: {
      fill: black,
      font: defaultFont,
      fontSize: 11
    },
    trail: {
      fill: defaultColor,
      size: defaultStrokeWidth
    },
    // style definitions
    style: {
      // axis & legend labels
      'guide-label': {
        fill: black,
        font: defaultFont,
        fontSize: 10
      },
      // axis & legend titles
      'guide-title': {
        fill: black,
        font: defaultFont,
        fontSize: 11,
        fontWeight: 'bold'
      },
      // headers, including chart title
      'group-title': {
        fill: black,
        font: defaultFont,
        fontSize: 13,
        fontWeight: 'bold'
      },
      // chart subtitle
      'group-subtitle': {
        fill: black,
        font: defaultFont,
        fontSize: 12
      },
      // defaults for styled point marks in Vega-Lite
      point: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth,
        shape: 'circle'
      },
      circle: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth
      },
      square: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth,
        shape: 'square'
      },
      // defaults for styled group marks in Vega-Lite
      cell: {
        fill: 'transparent',
        stroke: lightGray
      },
      view: {
        fill: 'transparent'
      }
    },
    // defaults for title
    title: {
      orient: 'top',
      anchor: 'middle',
      offset: 4,
      subtitlePadding: 3
    },
    // defaults for axes
    axis: {
      minExtent: 0,
      maxExtent: 200,
      bandPosition: 0.5,
      domain: true,
      domainWidth: 1,
      domainColor: gray,
      grid: false,
      gridWidth: 1,
      gridColor: lightGray,
      labels: true,
      labelAngle: 0,
      labelLimit: 180,
      labelOffset: 0,
      labelPadding: 2,
      ticks: true,
      tickColor: gray,
      tickOffset: 0,
      tickRound: true,
      tickSize: 5,
      tickWidth: 1,
      titlePadding: 4
    },
    // correction for centering bias
    axisBand: {
      tickOffset: -0.5
    },
    // defaults for cartographic projection
    projection: {
      type: 'mercator'
    },
    // defaults for legends
    legend: {
      orient: 'right',
      padding: 0,
      gridAlign: 'each',
      columnPadding: 10,
      rowPadding: 2,
      symbolDirection: 'vertical',
      gradientDirection: 'vertical',
      gradientLength: 200,
      gradientThickness: 16,
      gradientStrokeColor: lightGray,
      gradientStrokeWidth: 0,
      gradientLabelOffset: 2,
      labelAlign: 'left',
      labelBaseline: 'middle',
      labelLimit: 160,
      labelOffset: 4,
      labelOverlap: true,
      symbolLimit: 30,
      symbolType: 'circle',
      symbolSize: 100,
      symbolOffset: 0,
      symbolStrokeWidth: 1.5,
      symbolBaseFillColor: 'transparent',
      symbolBaseStrokeColor: gray,
      titleLimit: 180,
      titleOrient: 'top',
      titlePadding: 5,
      layout: {
        offset: 18,
        direction: 'horizontal',
        left: {
          direction: 'vertical'
        },
        right: {
          direction: 'vertical'
        }
      }
    },
    // defaults for scale ranges
    range: {
      category: {
        scheme: 'tableau10'
      },
      ordinal: {
        scheme: 'blues'
      },
      heatmap: {
        scheme: 'yellowgreenblue'
      },
      ramp: {
        scheme: 'blues'
      },
      diverging: {
        scheme: 'blueorange',
        extent: [1, 0]
      },
      symbol: ['circle', 'square', 'triangle-up', 'cross', 'diamond', 'triangle-right', 'triangle-down', 'triangle-left']
    }
  };
}

function parse (spec, config, options) {
  if (!isObject(spec)) {
    error('Input Vega specification must be an object.');
  }
  config = mergeConfig(defaults(), config, spec.config);
  return parseView(spec, new Scope(config, options)).toRuntime();
}

export { AxisDomainRole, AxisGridRole, AxisLabelRole, AxisRole, AxisTickRole, AxisTitleRole, DataScope, FrameRole, LegendEntryRole, LegendLabelRole, LegendRole, LegendSymbolRole, LegendTitleRole, MarkRole, Scope, ScopeRole, defaults as config, parse, parseSignal as signal, parseSignalUpdates as signalUpdates, parseStream as stream };
