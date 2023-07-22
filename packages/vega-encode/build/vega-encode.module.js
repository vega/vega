import { Transform, ingest, tupleid, stableCompare } from 'vega-dataflow';
import { tickCount, tickFormat, validTicks, tickValues, SymbolLegend, labelFormat, labelValues, GradientLegend, scaleFraction, labelFraction, scale, Sequential, Linear, isContinuous, Time, UTC, Ordinal, scaleImplicit, Log, Sqrt, Pow, Symlog, isLogarithmic, BinOrdinal, isInterpolating, interpolateColors, interpolate, Band, Point, bandSpace, scheme, Threshold, Quantile, Quantize, quantizeInterpolator, interpolateRange, Diverging } from 'vega-scale';
import { inherits, isArray, error, fastmap, falsy, isFunction, constant, peek, one, toSet, isString, zoomLog, zoomPow, zoomSymlog, zoomLinear, stringValue } from 'vega-util';
import { sum, range } from 'd3-array';
import { interpolateRound, interpolate as interpolate$1 } from 'd3-interpolate';

/**
 * Generates axis ticks for visualizing a spatial scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate ticks for.
 * @param {*} [params.count=10] - The approximate number of ticks, or
 *   desired tick interval, to use.
 * @param {Array<*>} [params.values] - The exact tick values to use.
 *   These must be legal domain values for the provided scale.
 *   If provided, the count argument is ignored.
 * @param {function(*):string} [params.formatSpecifier] - A format specifier
 *   to use in conjunction with scale.tickFormat. Legal values are
 *   any valid d3 4.0 format specifier.
 * @param {function(*):string} [params.format] - The format function to use.
 *   If provided, the formatSpecifier argument is ignored.
 */
function AxisTicks(params) {
  Transform.call(this, null, params);
}
inherits(AxisTicks, Transform, {
  transform(_, pulse) {
    if (this.value && !_.modified()) {
      return pulse.StopPropagation;
    }
    var locale = pulse.dataflow.locale(),
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      ticks = this.value,
      scale = _.scale,
      tally = _.count == null ? _.values ? _.values.length : 10 : _.count,
      count = tickCount(scale, tally, _.minstep),
      format = _.format || tickFormat(locale, scale, count, _.formatSpecifier, _.formatType, !!_.values),
      values = _.values ? validTicks(scale, _.values, count) : tickValues(scale, count);
    if (ticks) out.rem = ticks;
    ticks = values.map((value, i) => ingest({
      index: i / (values.length - 1 || 1),
      value: value,
      label: format(value)
    }));
    if (_.extra && ticks.length) {
      // add an extra tick pegged to the initial domain value
      // this is used to generate axes with 'binned' domains
      ticks.push(ingest({
        index: -1,
        extra: {
          value: ticks[0].value
        },
        label: ''
      }));
    }
    out.source = ticks;
    out.add = ticks;
    this.value = ticks;
    return out;
  }
});

/**
 * Joins a set of data elements against a set of visual items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): object} [params.item] - An item generator function.
 * @param {function(object): *} [params.key] - The key field associating data and visual items.
 */
function DataJoin(params) {
  Transform.call(this, null, params);
}
function defaultItemCreate() {
  return ingest({});
}
function newMap(key) {
  const map = fastmap().test(t => t.exit);
  map.lookup = t => map.get(key(t));
  return map;
}
inherits(DataJoin, Transform, {
  transform(_, pulse) {
    var df = pulse.dataflow,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      item = _.item || defaultItemCreate,
      key = _.key || tupleid,
      map = this.value;

    // prevent transient (e.g., hover) requests from
    // cascading across marks derived from marks
    if (isArray(out.encode)) {
      out.encode = null;
    }
    if (map && (_.modified('key') || pulse.modified(key))) {
      error('DataJoin does not support modified key function or fields.');
    }
    if (!map) {
      pulse = pulse.addAll();
      this.value = map = newMap(key);
    }
    pulse.visit(pulse.ADD, t => {
      const k = key(t);
      let x = map.get(k);
      if (x) {
        if (x.exit) {
          map.empty--;
          out.add.push(x);
        } else {
          out.mod.push(x);
        }
      } else {
        x = item(t);
        map.set(k, x);
        out.add.push(x);
      }
      x.datum = t;
      x.exit = false;
    });
    pulse.visit(pulse.MOD, t => {
      const k = key(t),
        x = map.get(k);
      if (x) {
        x.datum = t;
        out.mod.push(x);
      }
    });
    pulse.visit(pulse.REM, t => {
      const k = key(t),
        x = map.get(k);
      if (t === x.datum && !x.exit) {
        out.rem.push(x);
        x.exit = true;
        ++map.empty;
      }
    });
    if (pulse.changed(pulse.ADD_MOD)) out.modifies('datum');
    if (pulse.clean() || _.clean && map.empty > df.cleanThreshold) {
      df.runAfter(map.clean);
    }
    return out;
  }
});

/**
 * Invokes encoding functions for visual items.
 * @constructor
 * @param {object} params - The parameters to the encoding functions. This
 *   parameter object will be passed through to all invoked encoding functions.
 * @param {object} [params.mod=false] - Flag indicating if tuples in the input
 *   mod set that are unmodified by encoders should be included in the output.
 * @param {object} param.encoders - The encoding functions
 * @param {function(object, object): boolean} [param.encoders.update] - Update encoding set
 * @param {function(object, object): boolean} [param.encoders.enter] - Enter encoding set
 * @param {function(object, object): boolean} [param.encoders.exit] - Exit encoding set
 */
function Encode(params) {
  Transform.call(this, null, params);
}
inherits(Encode, Transform, {
  transform(_, pulse) {
    var out = pulse.fork(pulse.ADD_REM),
      fmod = _.mod || false,
      encoders = _.encoders,
      encode = pulse.encode;

    // if an array, the encode directive includes additional sets
    // that must be defined in order for the primary set to be invoked
    // e.g., only run the update set if the hover set is defined
    if (isArray(encode)) {
      if (out.changed() || encode.every(e => encoders[e])) {
        encode = encode[0];
        out.encode = null; // consume targeted encode directive
      } else {
        return pulse.StopPropagation;
      }
    }

    // marshall encoder functions
    var reenter = encode === 'enter',
      update = encoders.update || falsy,
      enter = encoders.enter || falsy,
      exit = encoders.exit || falsy,
      set = (encode && !reenter ? encoders[encode] : update) || falsy;
    if (pulse.changed(pulse.ADD)) {
      pulse.visit(pulse.ADD, t => {
        enter(t, _);
        update(t, _);
      });
      out.modifies(enter.output);
      out.modifies(update.output);
      if (set !== falsy && set !== update) {
        pulse.visit(pulse.ADD, t => {
          set(t, _);
        });
        out.modifies(set.output);
      }
    }
    if (pulse.changed(pulse.REM) && exit !== falsy) {
      pulse.visit(pulse.REM, t => {
        exit(t, _);
      });
      out.modifies(exit.output);
    }
    if (reenter || set !== falsy) {
      const flag = pulse.MOD | (_.modified() ? pulse.REFLOW : 0);
      if (reenter) {
        pulse.visit(flag, t => {
          const mod = enter(t, _) || fmod;
          if (set(t, _) || mod) out.mod.push(t);
        });
        if (out.mod.length) out.modifies(enter.output);
      } else {
        pulse.visit(flag, t => {
          if (set(t, _) || fmod) out.mod.push(t);
        });
      }
      if (out.mod.length) out.modifies(set.output);
    }
    return out.changed() ? out : pulse.StopPropagation;
  }
});

/**
 * Generates legend entries for visualizing a scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate items for.
 * @param {*} [params.count=5] - The approximate number of items, or
 *   desired tick interval, to use.
 * @param {*} [params.limit] - The maximum number of entries to
 *   include in a symbol legend.
 * @param {Array<*>} [params.values] - The exact tick values to use.
 *   These must be legal domain values for the provided scale.
 *   If provided, the count argument is ignored.
 * @param {string} [params.formatSpecifier] - A format specifier
 *   to use in conjunction with scale.tickFormat. Legal values are
 *   any valid D3 format specifier string.
 * @param {function(*):string} [params.format] - The format function to use.
 *   If provided, the formatSpecifier argument is ignored.
 */
function LegendEntries(params) {
  Transform.call(this, [], params);
}
inherits(LegendEntries, Transform, {
  transform(_, pulse) {
    if (this.value != null && !_.modified()) {
      return pulse.StopPropagation;
    }
    var locale = pulse.dataflow.locale(),
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      items = this.value,
      type = _.type || SymbolLegend,
      scale = _.scale,
      limit = +_.limit,
      count = tickCount(scale, _.count == null ? 5 : _.count, _.minstep),
      lskip = !!_.values || type === SymbolLegend,
      format = _.format || labelFormat(locale, scale, count, type, _.formatSpecifier, _.formatType, lskip),
      values = _.values || labelValues(scale, count),
      domain,
      fraction,
      size,
      offset,
      ellipsis;
    if (items) out.rem = items;
    if (type === SymbolLegend) {
      if (limit && values.length > limit) {
        pulse.dataflow.warn('Symbol legend count exceeds limit, filtering items.');
        items = values.slice(0, limit - 1);
        ellipsis = true;
      } else {
        items = values;
      }
      if (isFunction(size = _.size)) {
        // if first value maps to size zero, remove from list (vega#717)
        if (!_.values && scale(items[0]) === 0) {
          items = items.slice(1);
        }
        // compute size offset for legend entries
        offset = items.reduce((max, value) => Math.max(max, size(value, _)), 0);
      } else {
        size = constant(offset = size || 8);
      }
      items = items.map((value, index) => ingest({
        index: index,
        label: format(value, index, items),
        value: value,
        offset: offset,
        size: size(value, _)
      }));
      if (ellipsis) {
        ellipsis = values[items.length];
        items.push(ingest({
          index: items.length,
          label: `\u2026${values.length - items.length} entries`,
          value: ellipsis,
          offset: offset,
          size: size(ellipsis, _)
        }));
      }
    } else if (type === GradientLegend) {
      domain = scale.domain(), fraction = scaleFraction(scale, domain[0], peek(domain));

      // if automatic label generation produces 2 or fewer values,
      // use the domain end points instead (fixes vega/vega#1364)
      if (values.length < 3 && !_.values && domain[0] !== peek(domain)) {
        values = [domain[0], peek(domain)];
      }
      items = values.map((value, index) => ingest({
        index: index,
        label: format(value, index, values),
        value: value,
        perc: fraction(value)
      }));
    } else {
      size = values.length - 1;
      fraction = labelFraction(scale);
      items = values.map((value, index) => ingest({
        index: index,
        label: format(value, index, values),
        value: value,
        perc: index ? fraction(value) : 0,
        perc2: index === size ? 1 : fraction(values[index + 1])
      }));
    }
    out.source = items;
    out.add = items;
    this.value = items;
    return out;
  }
});

const sourceX = t => t.source.x;
const sourceY = t => t.source.y;
const targetX = t => t.target.x;
const targetY = t => t.target.y;

/**
 * Layout paths linking source and target elements.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function LinkPath(params) {
  Transform.call(this, {}, params);
}
LinkPath.Definition = {
  'type': 'LinkPath',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'sourceX',
    'type': 'field',
    'default': 'source.x'
  }, {
    'name': 'sourceY',
    'type': 'field',
    'default': 'source.y'
  }, {
    'name': 'targetX',
    'type': 'field',
    'default': 'target.x'
  }, {
    'name': 'targetY',
    'type': 'field',
    'default': 'target.y'
  }, {
    'name': 'orient',
    'type': 'enum',
    'default': 'vertical',
    'values': ['horizontal', 'vertical', 'radial']
  }, {
    'name': 'shape',
    'type': 'enum',
    'default': 'line',
    'values': ['line', 'arc', 'curve', 'diagonal', 'orthogonal']
  }, {
    'name': 'require',
    'type': 'signal'
  }, {
    'name': 'as',
    'type': 'string',
    'default': 'path'
  }]
};
inherits(LinkPath, Transform, {
  transform(_, pulse) {
    var sx = _.sourceX || sourceX,
      sy = _.sourceY || sourceY,
      tx = _.targetX || targetX,
      ty = _.targetY || targetY,
      as = _.as || 'path',
      orient = _.orient || 'vertical',
      shape = _.shape || 'line',
      path = Paths.get(shape + '-' + orient) || Paths.get(shape);
    if (!path) {
      error('LinkPath unsupported type: ' + _.shape + (_.orient ? '-' + _.orient : ''));
    }
    pulse.visit(pulse.SOURCE, t => {
      t[as] = path(sx(t), sy(t), tx(t), ty(t));
    });
    return pulse.reflow(_.modified()).modifies(as);
  }
});
const line = (sx, sy, tx, ty) => 'M' + sx + ',' + sy + 'L' + tx + ',' + ty;
const lineR = (sa, sr, ta, tr) => line(sr * Math.cos(sa), sr * Math.sin(sa), tr * Math.cos(ta), tr * Math.sin(ta));
const arc = (sx, sy, tx, ty) => {
  var dx = tx - sx,
    dy = ty - sy,
    rr = Math.hypot(dx, dy) / 2,
    ra = 180 * Math.atan2(dy, dx) / Math.PI;
  return 'M' + sx + ',' + sy + 'A' + rr + ',' + rr + ' ' + ra + ' 0 1' + ' ' + tx + ',' + ty;
};
const arcR = (sa, sr, ta, tr) => arc(sr * Math.cos(sa), sr * Math.sin(sa), tr * Math.cos(ta), tr * Math.sin(ta));
const curve = (sx, sy, tx, ty) => {
  const dx = tx - sx,
    dy = ty - sy,
    ix = 0.2 * (dx + dy),
    iy = 0.2 * (dy - dx);
  return 'M' + sx + ',' + sy + 'C' + (sx + ix) + ',' + (sy + iy) + ' ' + (tx + iy) + ',' + (ty - ix) + ' ' + tx + ',' + ty;
};
const curveR = (sa, sr, ta, tr) => curve(sr * Math.cos(sa), sr * Math.sin(sa), tr * Math.cos(ta), tr * Math.sin(ta));
const orthoX = (sx, sy, tx, ty) => 'M' + sx + ',' + sy + 'V' + ty + 'H' + tx;
const orthoY = (sx, sy, tx, ty) => 'M' + sx + ',' + sy + 'H' + tx + 'V' + ty;
const orthoR = (sa, sr, ta, tr) => {
  const sc = Math.cos(sa),
    ss = Math.sin(sa),
    tc = Math.cos(ta),
    ts = Math.sin(ta),
    sf = Math.abs(ta - sa) > Math.PI ? ta <= sa : ta > sa;
  return 'M' + sr * sc + ',' + sr * ss + 'A' + sr + ',' + sr + ' 0 0,' + (sf ? 1 : 0) + ' ' + sr * tc + ',' + sr * ts + 'L' + tr * tc + ',' + tr * ts;
};
const diagonalX = (sx, sy, tx, ty) => {
  const m = (sx + tx) / 2;
  return 'M' + sx + ',' + sy + 'C' + m + ',' + sy + ' ' + m + ',' + ty + ' ' + tx + ',' + ty;
};
const diagonalY = (sx, sy, tx, ty) => {
  const m = (sy + ty) / 2;
  return 'M' + sx + ',' + sy + 'C' + sx + ',' + m + ' ' + tx + ',' + m + ' ' + tx + ',' + ty;
};
const diagonalR = (sa, sr, ta, tr) => {
  const sc = Math.cos(sa),
    ss = Math.sin(sa),
    tc = Math.cos(ta),
    ts = Math.sin(ta),
    mr = (sr + tr) / 2;
  return 'M' + sr * sc + ',' + sr * ss + 'C' + mr * sc + ',' + mr * ss + ' ' + mr * tc + ',' + mr * ts + ' ' + tr * tc + ',' + tr * ts;
};
const Paths = fastmap({
  'line': line,
  'line-radial': lineR,
  'arc': arc,
  'arc-radial': arcR,
  'curve': curve,
  'curve-radial': curveR,
  'orthogonal-horizontal': orthoX,
  'orthogonal-vertical': orthoY,
  'orthogonal-radial': orthoR,
  'diagonal-horizontal': diagonalX,
  'diagonal-vertical': diagonalY,
  'diagonal-radial': diagonalR
});

/**
 * Pie and donut chart layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size pie segments.
 * @param {number} [params.startAngle=0] - The start angle (in radians) of the layout.
 * @param {number} [params.endAngle=2π] - The end angle (in radians) of the layout.
 * @param {boolean} [params.sort] - Boolean flag for sorting sectors by value.
 */
function Pie(params) {
  Transform.call(this, null, params);
}
Pie.Definition = {
  'type': 'Pie',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'field',
    'type': 'field'
  }, {
    'name': 'startAngle',
    'type': 'number',
    'default': 0
  }, {
    'name': 'endAngle',
    'type': 'number',
    'default': 6.283185307179586
  }, {
    'name': 'sort',
    'type': 'boolean',
    'default': false
  }, {
    'name': 'as',
    'type': 'string',
    'array': true,
    'length': 2,
    'default': ['startAngle', 'endAngle']
  }]
};
inherits(Pie, Transform, {
  transform(_, pulse) {
    var as = _.as || ['startAngle', 'endAngle'],
      startAngle = as[0],
      endAngle = as[1],
      field = _.field || one,
      start = _.startAngle || 0,
      stop = _.endAngle != null ? _.endAngle : 2 * Math.PI,
      data = pulse.source,
      values = data.map(field),
      n = values.length,
      a = start,
      k = (stop - start) / sum(values),
      index = range(n),
      i,
      t,
      v;
    if (_.sort) {
      index.sort((a, b) => values[a] - values[b]);
    }
    for (i = 0; i < n; ++i) {
      v = values[index[i]];
      t = data[index[i]];
      t[startAngle] = a;
      t[endAngle] = a += v * k;
    }
    this.value = values;
    return pulse.reflow(_.modified()).modifies(as);
  }
});

const DEFAULT_COUNT = 5;
function includeZero(scale) {
  const type = scale.type;
  return !scale.bins && (type === Linear || type === Pow || type === Sqrt);
}
function includePad(type) {
  return isContinuous(type) && type !== Sequential;
}
const SKIP = toSet(['set', 'modified', 'clear', 'type', 'scheme', 'schemeExtent', 'schemeCount', 'domain', 'domainMin', 'domainMid', 'domainMax', 'domainRaw', 'domainImplicit', 'nice', 'zero', 'bins', 'range', 'rangeStep', 'round', 'reverse', 'interpolate', 'interpolateGamma']);

/**
 * Maintains a scale function mapping data values to visual channels.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Scale(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

inherits(Scale, Transform, {
  transform(_, pulse) {
    var df = pulse.dataflow,
      scale$1 = this.value,
      key = scaleKey(_);
    if (!scale$1 || key !== scale$1.type) {
      this.value = scale$1 = scale(key)();
    }
    for (key in _) if (!SKIP[key]) {
      // padding is a scale property for band/point but not others
      if (key === 'padding' && includePad(scale$1.type)) continue;
      // invoke scale property setter, raise warning if not found
      isFunction(scale$1[key]) ? scale$1[key](_[key]) : df.warn('Unsupported scale property: ' + key);
    }
    configureRange(scale$1, _, configureBins(scale$1, _, configureDomain(scale$1, _, df)));
    return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
  }
});
function scaleKey(_) {
  var t = _.type,
    d = '',
    n;

  // backwards compatibility pre Vega 5.
  if (t === Sequential) return Sequential + '-' + Linear;
  if (isContinuousColor(_)) {
    n = _.rawDomain ? _.rawDomain.length : _.domain ? _.domain.length + +(_.domainMid != null) : 0;
    d = n === 2 ? Sequential + '-' : n === 3 ? Diverging + '-' : '';
  }
  return (d + t || Linear).toLowerCase();
}
function isContinuousColor(_) {
  const t = _.type;
  return isContinuous(t) && t !== Time && t !== UTC && (_.scheme || _.range && _.range.length && _.range.every(isString));
}
function configureDomain(scale, _, df) {
  // check raw domain, if provided use that and exit early
  const raw = rawDomain(scale, _.domainRaw, df);
  if (raw > -1) return raw;
  var domain = _.domain,
    type = scale.type,
    zero = _.zero || _.zero === undefined && includeZero(scale),
    n,
    mid;
  if (!domain) return 0;

  // adjust continuous domain for minimum pixel padding
  if (includePad(type) && _.padding && domain[0] !== peek(domain)) {
    domain = padDomain(type, domain, _.range, _.padding, _.exponent, _.constant);
  }

  // adjust domain based on zero, min, max settings
  if (zero || _.domainMin != null || _.domainMax != null || _.domainMid != null) {
    n = (domain = domain.slice()).length - 1 || 1;
    if (zero) {
      if (domain[0] > 0) domain[0] = 0;
      if (domain[n] < 0) domain[n] = 0;
    }
    if (_.domainMin != null) domain[0] = _.domainMin;
    if (_.domainMax != null) domain[n] = _.domainMax;
    if (_.domainMid != null) {
      mid = _.domainMid;
      const i = mid > domain[n] ? n + 1 : mid < domain[0] ? 0 : n;
      if (i !== n) df.warn('Scale domainMid exceeds domain min or max.', mid);
      domain.splice(i, 0, mid);
    }
  }

  // set the scale domain
  scale.domain(domainCheck(type, domain, df));

  // if ordinal scale domain is defined, prevent implicit
  // domain construction as side-effect of scale lookup
  if (type === Ordinal) {
    scale.unknown(_.domainImplicit ? scaleImplicit : undefined);
  }

  // perform 'nice' adjustment as requested
  if (_.nice && scale.nice) {
    scale.nice(_.nice !== true && tickCount(scale, _.nice) || null);
  }

  // return the cardinality of the domain
  return domain.length;
}
function rawDomain(scale, raw, df) {
  if (raw) {
    scale.domain(domainCheck(scale.type, raw, df));
    return raw.length;
  } else {
    return -1;
  }
}
function padDomain(type, domain, range, pad, exponent, constant) {
  var span = Math.abs(peek(range) - range[0]),
    frac = span / (span - 2 * pad),
    d = type === Log ? zoomLog(domain, null, frac) : type === Sqrt ? zoomPow(domain, null, frac, 0.5) : type === Pow ? zoomPow(domain, null, frac, exponent || 1) : type === Symlog ? zoomSymlog(domain, null, frac, constant || 1) : zoomLinear(domain, null, frac);
  domain = domain.slice();
  domain[0] = d[0];
  domain[domain.length - 1] = d[1];
  return domain;
}
function domainCheck(type, domain, df) {
  if (isLogarithmic(type)) {
    // sum signs of domain values
    // if all pos or all neg, abs(sum) === domain.length
    var s = Math.abs(domain.reduce((s, v) => s + (v < 0 ? -1 : v > 0 ? 1 : 0), 0));
    if (s !== domain.length) {
      df.warn('Log scale domain includes zero: ' + stringValue(domain));
    }
  }
  return domain;
}
function configureBins(scale, _, count) {
  let bins = _.bins;
  if (bins && !isArray(bins)) {
    // generate bin boundary array
    const domain = scale.domain(),
      lo = domain[0],
      hi = peek(domain),
      step = bins.step;
    let start = bins.start == null ? lo : bins.start,
      stop = bins.stop == null ? hi : bins.stop;
    if (!step) error('Scale bins parameter missing step property.');
    if (start < lo) start = step * Math.ceil(lo / step);
    if (stop > hi) stop = step * Math.floor(hi / step);
    bins = range(start, stop + step / 2, step);
  }
  if (bins) {
    // assign bin boundaries to scale instance
    scale.bins = bins;
  } else if (scale.bins) {
    // no current bins, remove bins if previously set
    delete scale.bins;
  }

  // special handling for bin-ordinal scales
  if (scale.type === BinOrdinal) {
    if (!bins) {
      // the domain specifies the bins
      scale.bins = scale.domain();
    } else if (!_.domain && !_.domainRaw) {
      // the bins specify the domain
      scale.domain(bins);
      count = bins.length;
    }
  }

  // return domain cardinality
  return count;
}
function configureRange(scale, _, count) {
  var type = scale.type,
    round = _.round || false,
    range = _.range;

  // if range step specified, calculate full range extent
  if (_.rangeStep != null) {
    range = configureRangeStep(type, _, count);
  }

  // else if a range scheme is defined, use that
  else if (_.scheme) {
    range = configureScheme(type, _, count);
    if (isFunction(range)) {
      if (scale.interpolator) {
        return scale.interpolator(range);
      } else {
        error(`Scale type ${type} does not support interpolating color schemes.`);
      }
    }
  }

  // given a range array for an interpolating scale, convert to interpolator
  if (range && isInterpolating(type)) {
    return scale.interpolator(interpolateColors(flip(range, _.reverse), _.interpolate, _.interpolateGamma));
  }

  // configure rounding / interpolation
  if (range && _.interpolate && scale.interpolate) {
    scale.interpolate(interpolate(_.interpolate, _.interpolateGamma));
  } else if (isFunction(scale.round)) {
    scale.round(round);
  } else if (isFunction(scale.rangeRound)) {
    scale.interpolate(round ? interpolateRound : interpolate$1);
  }
  if (range) scale.range(flip(range, _.reverse));
}
function configureRangeStep(type, _, count) {
  if (type !== Band && type !== Point) {
    error('Only band and point scales support rangeStep.');
  }

  // calculate full range based on requested step size and padding
  var outer = (_.paddingOuter != null ? _.paddingOuter : _.padding) || 0,
    inner = type === Point ? 1 : (_.paddingInner != null ? _.paddingInner : _.padding) || 0;
  return [0, _.rangeStep * bandSpace(count, inner, outer)];
}
function configureScheme(type, _, count) {
  var extent = _.schemeExtent,
    name,
    scheme$1;
  if (isArray(_.scheme)) {
    scheme$1 = interpolateColors(_.scheme, _.interpolate, _.interpolateGamma);
  } else {
    name = _.scheme.toLowerCase();
    scheme$1 = scheme(name);
    if (!scheme$1) error(`Unrecognized scheme name: ${_.scheme}`);
  }

  // determine size for potential discrete range
  count = type === Threshold ? count + 1 : type === BinOrdinal ? count - 1 : type === Quantile || type === Quantize ? +_.schemeCount || DEFAULT_COUNT : count;

  // adjust and/or quantize scheme as appropriate
  return isInterpolating(type) ? adjustScheme(scheme$1, extent, _.reverse) : isFunction(scheme$1) ? quantizeInterpolator(adjustScheme(scheme$1, extent), count) : type === Ordinal ? scheme$1 : scheme$1.slice(0, count);
}
function adjustScheme(scheme, extent, reverse) {
  return isFunction(scheme) && (extent || reverse) ? interpolateRange(scheme, flip(extent || [0, 1], reverse)) : scheme;
}
function flip(array, reverse) {
  return reverse ? array.slice().reverse() : array;
}

/**
 * Sorts scenegraph items in the pulse source array.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - A comparator
 *   function for sorting tuples.
 */
function SortItems(params) {
  Transform.call(this, null, params);
}
inherits(SortItems, Transform, {
  transform(_, pulse) {
    const mod = _.modified('sort') || pulse.changed(pulse.ADD) || pulse.modified(_.sort.fields) || pulse.modified('datum');
    if (mod) pulse.source.sort(stableCompare(_.sort));
    this.modified(mod);
    return pulse;
  }
});

const Zero = 'zero',
  Center = 'center',
  Normalize = 'normalize',
  DefOutput = ['y0', 'y1'];

/**
 * Stack layout for visualization elements.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to stack.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {function(object,object): number} [params.sort] - A comparator for stack sorting.
 * @param {string} [offset='zero'] - Stack baseline offset. One of 'zero', 'center', 'normalize'.
 */
function Stack(params) {
  Transform.call(this, null, params);
}
Stack.Definition = {
  'type': 'Stack',
  'metadata': {
    'modifies': true
  },
  'params': [{
    'name': 'field',
    'type': 'field'
  }, {
    'name': 'groupby',
    'type': 'field',
    'array': true
  }, {
    'name': 'sort',
    'type': 'compare'
  }, {
    'name': 'offset',
    'type': 'enum',
    'default': Zero,
    'values': [Zero, Center, Normalize]
  }, {
    'name': 'as',
    'type': 'string',
    'array': true,
    'length': 2,
    'default': DefOutput
  }]
};
inherits(Stack, Transform, {
  transform(_, pulse) {
    var as = _.as || DefOutput,
      y0 = as[0],
      y1 = as[1],
      sort = stableCompare(_.sort),
      field = _.field || one,
      stack = _.offset === Center ? stackCenter : _.offset === Normalize ? stackNormalize : stackZero,
      groups,
      i,
      n,
      max;

    // partition, sum, and sort the stack groups
    groups = partition(pulse.source, _.groupby, sort, field);

    // compute stack layouts per group
    for (i = 0, n = groups.length, max = groups.max; i < n; ++i) {
      stack(groups[i], max, field, y0, y1);
    }
    return pulse.reflow(_.modified()).modifies(as);
  }
});
function stackCenter(group, max, field, y0, y1) {
  var last = (max - group.sum) / 2,
    m = group.length,
    j = 0,
    t;
  for (; j < m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = last += Math.abs(field(t));
  }
}
function stackNormalize(group, max, field, y0, y1) {
  var scale = 1 / group.sum,
    last = 0,
    m = group.length,
    j = 0,
    v = 0,
    t;
  for (; j < m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = last = scale * (v += Math.abs(field(t)));
  }
}
function stackZero(group, max, field, y0, y1) {
  var lastPos = 0,
    lastNeg = 0,
    m = group.length,
    j = 0,
    v,
    t;
  for (; j < m; ++j) {
    t = group[j];
    v = +field(t);
    if (v < 0) {
      t[y0] = lastNeg;
      t[y1] = lastNeg += v;
    } else {
      t[y0] = lastPos;
      t[y1] = lastPos += v;
    }
  }
}
function partition(data, groupby, sort, field) {
  var groups = [],
    get = f => f(t),
    map,
    i,
    n,
    m,
    t,
    k,
    g,
    s,
    max;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data.slice());
  } else {
    for (map = {}, i = 0, n = data.length; i < n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k];
      if (!g) {
        map[k] = g = [];
        groups.push(g);
      }
      g.push(t);
    }
  }

  // compute sums of groups, sort groups as needed
  for (k = 0, max = 0, m = groups.length; k < m; ++k) {
    g = groups[k];
    for (i = 0, s = 0, n = g.length; i < n; ++i) {
      s += Math.abs(field(g[i]));
    }
    g.sum = s;
    if (s > max) max = s;
    if (sort) g.sort(sort);
  }
  groups.max = max;
  return groups;
}

export { AxisTicks as axisticks, DataJoin as datajoin, Encode as encode, LegendEntries as legendentries, LinkPath as linkpath, Pie as pie, Scale as scale, SortItems as sortitems, Stack as stack };
