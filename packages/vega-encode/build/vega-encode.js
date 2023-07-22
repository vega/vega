(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-dataflow'), require('vega-scale'), require('vega-util')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-dataflow', 'vega-scale', 'vega-util'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vega = {}, global.vega, global.vega, global.vega));
})(this, (function (exports, vegaDataflow, vegaScale, vegaUtil) { 'use strict';

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
    vegaDataflow.Transform.call(this, null, params);
  }
  vegaUtil.inherits(AxisTicks, vegaDataflow.Transform, {
    transform(_, pulse) {
      if (this.value && !_.modified()) {
        return pulse.StopPropagation;
      }
      var locale = pulse.dataflow.locale(),
        out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
        ticks = this.value,
        scale = _.scale,
        tally = _.count == null ? _.values ? _.values.length : 10 : _.count,
        count = vegaScale.tickCount(scale, tally, _.minstep),
        format = _.format || vegaScale.tickFormat(locale, scale, count, _.formatSpecifier, _.formatType, !!_.values),
        values = _.values ? vegaScale.validTicks(scale, _.values, count) : vegaScale.tickValues(scale, count);
      if (ticks) out.rem = ticks;
      ticks = values.map((value, i) => vegaDataflow.ingest({
        index: i / (values.length - 1 || 1),
        value: value,
        label: format(value)
      }));
      if (_.extra && ticks.length) {
        // add an extra tick pegged to the initial domain value
        // this is used to generate axes with 'binned' domains
        ticks.push(vegaDataflow.ingest({
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
    vegaDataflow.Transform.call(this, null, params);
  }
  function defaultItemCreate() {
    return vegaDataflow.ingest({});
  }
  function newMap(key) {
    const map = vegaUtil.fastmap().test(t => t.exit);
    map.lookup = t => map.get(key(t));
    return map;
  }
  vegaUtil.inherits(DataJoin, vegaDataflow.Transform, {
    transform(_, pulse) {
      var df = pulse.dataflow,
        out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
        item = _.item || defaultItemCreate,
        key = _.key || vegaDataflow.tupleid,
        map = this.value;

      // prevent transient (e.g., hover) requests from
      // cascading across marks derived from marks
      if (vegaUtil.isArray(out.encode)) {
        out.encode = null;
      }
      if (map && (_.modified('key') || pulse.modified(key))) {
        vegaUtil.error('DataJoin does not support modified key function or fields.');
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
    vegaDataflow.Transform.call(this, null, params);
  }
  vegaUtil.inherits(Encode, vegaDataflow.Transform, {
    transform(_, pulse) {
      var out = pulse.fork(pulse.ADD_REM),
        fmod = _.mod || false,
        encoders = _.encoders,
        encode = pulse.encode;

      // if an array, the encode directive includes additional sets
      // that must be defined in order for the primary set to be invoked
      // e.g., only run the update set if the hover set is defined
      if (vegaUtil.isArray(encode)) {
        if (out.changed() || encode.every(e => encoders[e])) {
          encode = encode[0];
          out.encode = null; // consume targeted encode directive
        } else {
          return pulse.StopPropagation;
        }
      }

      // marshall encoder functions
      var reenter = encode === 'enter',
        update = encoders.update || vegaUtil.falsy,
        enter = encoders.enter || vegaUtil.falsy,
        exit = encoders.exit || vegaUtil.falsy,
        set = (encode && !reenter ? encoders[encode] : update) || vegaUtil.falsy;
      if (pulse.changed(pulse.ADD)) {
        pulse.visit(pulse.ADD, t => {
          enter(t, _);
          update(t, _);
        });
        out.modifies(enter.output);
        out.modifies(update.output);
        if (set !== vegaUtil.falsy && set !== update) {
          pulse.visit(pulse.ADD, t => {
            set(t, _);
          });
          out.modifies(set.output);
        }
      }
      if (pulse.changed(pulse.REM) && exit !== vegaUtil.falsy) {
        pulse.visit(pulse.REM, t => {
          exit(t, _);
        });
        out.modifies(exit.output);
      }
      if (reenter || set !== vegaUtil.falsy) {
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
    vegaDataflow.Transform.call(this, [], params);
  }
  vegaUtil.inherits(LegendEntries, vegaDataflow.Transform, {
    transform(_, pulse) {
      if (this.value != null && !_.modified()) {
        return pulse.StopPropagation;
      }
      var locale = pulse.dataflow.locale(),
        out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
        items = this.value,
        type = _.type || vegaScale.SymbolLegend,
        scale = _.scale,
        limit = +_.limit,
        count = vegaScale.tickCount(scale, _.count == null ? 5 : _.count, _.minstep),
        lskip = !!_.values || type === vegaScale.SymbolLegend,
        format = _.format || vegaScale.labelFormat(locale, scale, count, type, _.formatSpecifier, _.formatType, lskip),
        values = _.values || vegaScale.labelValues(scale, count),
        domain,
        fraction,
        size,
        offset,
        ellipsis;
      if (items) out.rem = items;
      if (type === vegaScale.SymbolLegend) {
        if (limit && values.length > limit) {
          pulse.dataflow.warn('Symbol legend count exceeds limit, filtering items.');
          items = values.slice(0, limit - 1);
          ellipsis = true;
        } else {
          items = values;
        }
        if (vegaUtil.isFunction(size = _.size)) {
          // if first value maps to size zero, remove from list (vega#717)
          if (!_.values && scale(items[0]) === 0) {
            items = items.slice(1);
          }
          // compute size offset for legend entries
          offset = items.reduce((max, value) => Math.max(max, size(value, _)), 0);
        } else {
          size = vegaUtil.constant(offset = size || 8);
        }
        items = items.map((value, index) => vegaDataflow.ingest({
          index: index,
          label: format(value, index, items),
          value: value,
          offset: offset,
          size: size(value, _)
        }));
        if (ellipsis) {
          ellipsis = values[items.length];
          items.push(vegaDataflow.ingest({
            index: items.length,
            label: `\u2026${values.length - items.length} entries`,
            value: ellipsis,
            offset: offset,
            size: size(ellipsis, _)
          }));
        }
      } else if (type === vegaScale.GradientLegend) {
        domain = scale.domain(), fraction = vegaScale.scaleFraction(scale, domain[0], vegaUtil.peek(domain));

        // if automatic label generation produces 2 or fewer values,
        // use the domain end points instead (fixes vega/vega#1364)
        if (values.length < 3 && !_.values && domain[0] !== vegaUtil.peek(domain)) {
          values = [domain[0], vegaUtil.peek(domain)];
        }
        items = values.map((value, index) => vegaDataflow.ingest({
          index: index,
          label: format(value, index, values),
          value: value,
          perc: fraction(value)
        }));
      } else {
        size = values.length - 1;
        fraction = vegaScale.labelFraction(scale);
        items = values.map((value, index) => vegaDataflow.ingest({
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
    vegaDataflow.Transform.call(this, {}, params);
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
  vegaUtil.inherits(LinkPath, vegaDataflow.Transform, {
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
        vegaUtil.error('LinkPath unsupported type: ' + _.shape + (_.orient ? '-' + _.orient : ''));
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
  const Paths = vegaUtil.fastmap({
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

  function range(start, stop, step) {
    start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;
    var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);
    while (++i < n) {
      range[i] = start + i * step;
    }
    return range;
  }

  function sum(values, valueof) {
    let sum = 0;
    if (valueof === undefined) {
      for (let value of values) {
        if (value = +value) {
          sum += value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if (value = +valueof(value, ++index, values)) {
          sum += value;
        }
      }
    }
    return sum;
  }

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
    vegaDataflow.Transform.call(this, null, params);
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
  vegaUtil.inherits(Pie, vegaDataflow.Transform, {
    transform(_, pulse) {
      var as = _.as || ['startAngle', 'endAngle'],
        startAngle = as[0],
        endAngle = as[1],
        field = _.field || vegaUtil.one,
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

  function define (constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }
  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  function Color() {}
  var darker = 0.7;
  var brighter = 1 / darker;
  var reI = "\\s*([+-]?\\d+)\\s*",
    reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex = /^#([0-9a-f]{3,8})$/,
    reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
    reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
    reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
    reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
    reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
    reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };
  define(Color, color, {
    copy(channels) {
      return Object.assign(new this.constructor(), this, channels);
    },
    displayable() {
      return this.rgb().displayable();
    },
    hex: color_formatHex,
    // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHex8: color_formatHex8,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });
  function color_formatHex() {
    return this.rgb().formatHex();
  }
  function color_formatHex8() {
    return this.rgb().formatHex8();
  }
  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }
  function color_formatRgb() {
    return this.rgb().formatRgb();
  }
  function color(format) {
    var m, l;
    format = (format + "").trim().toLowerCase();
    return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
    : l === 3 ? new Rgb(m >> 8 & 0xf | m >> 4 & 0xf0, m >> 4 & 0xf | m & 0xf0, (m & 0xf) << 4 | m & 0xf, 1) // #f00
    : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
    : l === 4 ? rgba(m >> 12 & 0xf | m >> 8 & 0xf0, m >> 8 & 0xf | m >> 4 & 0xf0, m >> 4 & 0xf | m & 0xf0, ((m & 0xf) << 4 | m & 0xf) / 0xff) // #f000
    : null // invalid hex
    ) : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
    : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
    : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
    : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
    : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
    : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
    : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
    : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
  }
  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }
  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }
  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb();
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }
  function rgb$1(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }
  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }
  define(Rgb, rgb$1, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb() {
      return this;
    },
    clamp() {
      return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
    },
    displayable() {
      return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
    },
    hex: rgb_formatHex,
    // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatHex8: rgb_formatHex8,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));
  function rgb_formatHex() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
  }
  function rgb_formatHex8() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
  }
  function rgb_formatRgb() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
  }
  function clampa(opacity) {
    return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
  }
  function clampi(value) {
    return Math.max(0, Math.min(255, Math.round(value) || 0));
  }
  function hex(value) {
    value = clampi(value);
    return (value < 16 ? "0" : "") + value.toString(16);
  }
  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;else if (l <= 0 || l >= 1) h = s = NaN;else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }
  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl();
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;else if (g === max) h = (b - r) / s + 2;else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }
  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }
  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }
  define(Hsl, hsl, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb() {
      var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
      return new Rgb(hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb(h, m1, m2), hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
    },
    clamp() {
      return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
    },
    displayable() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
    },
    formatHsl() {
      const a = clampa(this.opacity);
      return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
    }
  }));
  function clamph(value) {
    value = (value || 0) % 360;
    return value < 0 ? value + 360 : value;
  }
  function clampt(value) {
    return Math.max(0, Math.min(1, value || 0));
  }

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
  }

  var constant = (x => () => x);

  function linear(a, d) {
    return function (t) {
      return a + t * d;
    };
  }
  function exponential(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function (t) {
      return Math.pow(a + t * b, y);
    };
  }
  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function (a, b) {
      return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
    };
  }
  function nogamma(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant(isNaN(a) ? b : a);
  }

  var rgb = (function rgbGamma(y) {
    var color = gamma(y);
    function rgb(start, end) {
      var r = color((start = rgb$1(start)).r, (end = rgb$1(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
      return function (t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }
    rgb.gamma = rgbGamma;
    return rgb;
  })(1);

  function numberArray (a, b) {
    if (!b) b = [];
    var n = a ? Math.min(b.length, a.length) : 0,
      c = b.slice(),
      i;
    return function (t) {
      for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
      return c;
    };
  }
  function isNumberArray(x) {
    return ArrayBuffer.isView(x) && !(x instanceof DataView);
  }

  function genericArray(a, b) {
    var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(na),
      c = new Array(nb),
      i;
    for (i = 0; i < na; ++i) x[i] = interpolate(a[i], b[i]);
    for (; i < nb; ++i) c[i] = b[i];
    return function (t) {
      for (i = 0; i < na; ++i) c[i] = x[i](t);
      return c;
    };
  }

  function date (a, b) {
    var d = new Date();
    return a = +a, b = +b, function (t) {
      return d.setTime(a * (1 - t) + b * t), d;
    };
  }

  function number (a, b) {
    return a = +a, b = +b, function (t) {
      return a * (1 - t) + b * t;
    };
  }

  function object (a, b) {
    var i = {},
      c = {},
      k;
    if (a === null || typeof a !== "object") a = {};
    if (b === null || typeof b !== "object") b = {};
    for (k in b) {
      if (k in a) {
        i[k] = interpolate(a[k], b[k]);
      } else {
        c[k] = b[k];
      }
    }
    return function (t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }

  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    reB = new RegExp(reA.source, "g");
  function zero(b) {
    return function () {
      return b;
    };
  }
  function one(b) {
    return function (t) {
      return b(t) + "";
    };
  }
  function string (a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0,
      // scan index for next number in b
      am,
      // current match in a
      bm,
      // current match in b
      bs,
      // string preceding current number in b, if any
      i = -1,
      // index in s
      s = [],
      // string constants and placeholders
      q = []; // number interpolators

    // Coerce inputs to strings.
    a = a + "", b = b + "";

    // Interpolate pairs of numbers in a & b.
    while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) {
        // a string precedes the next number in b
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        // numbers in a & b match
        if (s[i]) s[i] += bm; // coalesce with previous string
        else s[++i] = bm;
      } else {
        // interpolate non-matching numbers
        s[++i] = null;
        q.push({
          i: i,
          x: number(am, bm)
        });
      }
      bi = reB.lastIndex;
    }

    // Add remains of b.
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }

    // Special optimization for only a single match.
    // Otherwise, interpolate each of the numbers and rejoin the string.
    return s.length < 2 ? q[0] ? one(q[0].x) : zero(b) : (b = q.length, function (t) {
      for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    });
  }

  function interpolate (a, b) {
    var t = typeof b,
      c;
    return b == null || t === "boolean" ? constant(b) : (t === "number" ? number : t === "string" ? (c = color(b)) ? (b = c, rgb) : string : b instanceof color ? rgb : b instanceof Date ? date : isNumberArray(b) ? numberArray : Array.isArray(b) ? genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object : number)(a, b);
  }

  function interpolateRound (a, b) {
    return a = +a, b = +b, function (t) {
      return Math.round(a * (1 - t) + b * t);
    };
  }

  const DEFAULT_COUNT = 5;
  function includeZero(scale) {
    const type = scale.type;
    return !scale.bins && (type === vegaScale.Linear || type === vegaScale.Pow || type === vegaScale.Sqrt);
  }
  function includePad(type) {
    return vegaScale.isContinuous(type) && type !== vegaScale.Sequential;
  }
  const SKIP = vegaUtil.toSet(['set', 'modified', 'clear', 'type', 'scheme', 'schemeExtent', 'schemeCount', 'domain', 'domainMin', 'domainMid', 'domainMax', 'domainRaw', 'domainImplicit', 'nice', 'zero', 'bins', 'range', 'rangeStep', 'round', 'reverse', 'interpolate', 'interpolateGamma']);

  /**
   * Maintains a scale function mapping data values to visual channels.
   * @constructor
   * @param {object} params - The parameters for this operator.
   */
  function Scale(params) {
    vegaDataflow.Transform.call(this, null, params);
    this.modified(true); // always treat as modified
  }

  vegaUtil.inherits(Scale, vegaDataflow.Transform, {
    transform(_, pulse) {
      var df = pulse.dataflow,
        scale = this.value,
        key = scaleKey(_);
      if (!scale || key !== scale.type) {
        this.value = scale = vegaScale.scale(key)();
      }
      for (key in _) if (!SKIP[key]) {
        // padding is a scale property for band/point but not others
        if (key === 'padding' && includePad(scale.type)) continue;
        // invoke scale property setter, raise warning if not found
        vegaUtil.isFunction(scale[key]) ? scale[key](_[key]) : df.warn('Unsupported scale property: ' + key);
      }
      configureRange(scale, _, configureBins(scale, _, configureDomain(scale, _, df)));
      return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
    }
  });
  function scaleKey(_) {
    var t = _.type,
      d = '',
      n;

    // backwards compatibility pre Vega 5.
    if (t === vegaScale.Sequential) return vegaScale.Sequential + '-' + vegaScale.Linear;
    if (isContinuousColor(_)) {
      n = _.rawDomain ? _.rawDomain.length : _.domain ? _.domain.length + +(_.domainMid != null) : 0;
      d = n === 2 ? vegaScale.Sequential + '-' : n === 3 ? vegaScale.Diverging + '-' : '';
    }
    return (d + t || vegaScale.Linear).toLowerCase();
  }
  function isContinuousColor(_) {
    const t = _.type;
    return vegaScale.isContinuous(t) && t !== vegaScale.Time && t !== vegaScale.UTC && (_.scheme || _.range && _.range.length && _.range.every(vegaUtil.isString));
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
    if (includePad(type) && _.padding && domain[0] !== vegaUtil.peek(domain)) {
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
    if (type === vegaScale.Ordinal) {
      scale.unknown(_.domainImplicit ? vegaScale.scaleImplicit : undefined);
    }

    // perform 'nice' adjustment as requested
    if (_.nice && scale.nice) {
      scale.nice(_.nice !== true && vegaScale.tickCount(scale, _.nice) || null);
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
    var span = Math.abs(vegaUtil.peek(range) - range[0]),
      frac = span / (span - 2 * pad),
      d = type === vegaScale.Log ? vegaUtil.zoomLog(domain, null, frac) : type === vegaScale.Sqrt ? vegaUtil.zoomPow(domain, null, frac, 0.5) : type === vegaScale.Pow ? vegaUtil.zoomPow(domain, null, frac, exponent || 1) : type === vegaScale.Symlog ? vegaUtil.zoomSymlog(domain, null, frac, constant || 1) : vegaUtil.zoomLinear(domain, null, frac);
    domain = domain.slice();
    domain[0] = d[0];
    domain[domain.length - 1] = d[1];
    return domain;
  }
  function domainCheck(type, domain, df) {
    if (vegaScale.isLogarithmic(type)) {
      // sum signs of domain values
      // if all pos or all neg, abs(sum) === domain.length
      var s = Math.abs(domain.reduce((s, v) => s + (v < 0 ? -1 : v > 0 ? 1 : 0), 0));
      if (s !== domain.length) {
        df.warn('Log scale domain includes zero: ' + vegaUtil.stringValue(domain));
      }
    }
    return domain;
  }
  function configureBins(scale, _, count) {
    let bins = _.bins;
    if (bins && !vegaUtil.isArray(bins)) {
      // generate bin boundary array
      const domain = scale.domain(),
        lo = domain[0],
        hi = vegaUtil.peek(domain),
        step = bins.step;
      let start = bins.start == null ? lo : bins.start,
        stop = bins.stop == null ? hi : bins.stop;
      if (!step) vegaUtil.error('Scale bins parameter missing step property.');
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
    if (scale.type === vegaScale.BinOrdinal) {
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
      if (vegaUtil.isFunction(range)) {
        if (scale.interpolator) {
          return scale.interpolator(range);
        } else {
          vegaUtil.error(`Scale type ${type} does not support interpolating color schemes.`);
        }
      }
    }

    // given a range array for an interpolating scale, convert to interpolator
    if (range && vegaScale.isInterpolating(type)) {
      return scale.interpolator(vegaScale.interpolateColors(flip(range, _.reverse), _.interpolate, _.interpolateGamma));
    }

    // configure rounding / interpolation
    if (range && _.interpolate && scale.interpolate) {
      scale.interpolate(vegaScale.interpolate(_.interpolate, _.interpolateGamma));
    } else if (vegaUtil.isFunction(scale.round)) {
      scale.round(round);
    } else if (vegaUtil.isFunction(scale.rangeRound)) {
      scale.interpolate(round ? interpolateRound : interpolate);
    }
    if (range) scale.range(flip(range, _.reverse));
  }
  function configureRangeStep(type, _, count) {
    if (type !== vegaScale.Band && type !== vegaScale.Point) {
      vegaUtil.error('Only band and point scales support rangeStep.');
    }

    // calculate full range based on requested step size and padding
    var outer = (_.paddingOuter != null ? _.paddingOuter : _.padding) || 0,
      inner = type === vegaScale.Point ? 1 : (_.paddingInner != null ? _.paddingInner : _.padding) || 0;
    return [0, _.rangeStep * vegaScale.bandSpace(count, inner, outer)];
  }
  function configureScheme(type, _, count) {
    var extent = _.schemeExtent,
      name,
      scheme;
    if (vegaUtil.isArray(_.scheme)) {
      scheme = vegaScale.interpolateColors(_.scheme, _.interpolate, _.interpolateGamma);
    } else {
      name = _.scheme.toLowerCase();
      scheme = vegaScale.scheme(name);
      if (!scheme) vegaUtil.error(`Unrecognized scheme name: ${_.scheme}`);
    }

    // determine size for potential discrete range
    count = type === vegaScale.Threshold ? count + 1 : type === vegaScale.BinOrdinal ? count - 1 : type === vegaScale.Quantile || type === vegaScale.Quantize ? +_.schemeCount || DEFAULT_COUNT : count;

    // adjust and/or quantize scheme as appropriate
    return vegaScale.isInterpolating(type) ? adjustScheme(scheme, extent, _.reverse) : vegaUtil.isFunction(scheme) ? vegaScale.quantizeInterpolator(adjustScheme(scheme, extent), count) : type === vegaScale.Ordinal ? scheme : scheme.slice(0, count);
  }
  function adjustScheme(scheme, extent, reverse) {
    return vegaUtil.isFunction(scheme) && (extent || reverse) ? vegaScale.interpolateRange(scheme, flip(extent || [0, 1], reverse)) : scheme;
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
    vegaDataflow.Transform.call(this, null, params);
  }
  vegaUtil.inherits(SortItems, vegaDataflow.Transform, {
    transform(_, pulse) {
      const mod = _.modified('sort') || pulse.changed(pulse.ADD) || pulse.modified(_.sort.fields) || pulse.modified('datum');
      if (mod) pulse.source.sort(vegaDataflow.stableCompare(_.sort));
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
    vegaDataflow.Transform.call(this, null, params);
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
  vegaUtil.inherits(Stack, vegaDataflow.Transform, {
    transform(_, pulse) {
      var as = _.as || DefOutput,
        y0 = as[0],
        y1 = as[1],
        sort = vegaDataflow.stableCompare(_.sort),
        field = _.field || vegaUtil.one,
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

  exports.axisticks = AxisTicks;
  exports.datajoin = DataJoin;
  exports.encode = Encode;
  exports.legendentries = LegendEntries;
  exports.linkpath = LinkPath;
  exports.pie = Pie;
  exports.scale = Scale;
  exports.sortitems = SortItems;
  exports.stack = Stack;

}));
