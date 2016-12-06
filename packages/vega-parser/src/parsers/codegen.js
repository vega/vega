import {ASTNode, functions, constants} from 'vega-expression';
import {bandSpace} from 'vega-scale';
import {scaleGradient} from 'vega-scenegraph';
import {
  error, isArray, isObject, isString, pad, stringValue, truncate, truthy
} from 'vega-util';
import {rgb, lab, hcl, hsl} from 'd3-color';
import {format} from 'd3-format';
import {timeFormat, utcFormat} from 'd3-time-format';

export var scalePrefix  = '%';

var Literal = 'Literal',
    Identifier = 'Identifier',
    indexPrefix  = '@',
    tuplePrefix  = ':',
    eventPrefix  = 'event.vega.',
    thisPrefix   = 'this.';

// Expression Functions

var eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'];

var scaleFunctions = ['bandwidth', 'copy', 'domain', 'range', 'gradient', 'invert', 'scale'];

function getScale(name, ctx) {
  var s = isString(name) ? ctx.scales[name]
    : isObject(name) && name.signal ? ctx.signals[name.signal]
    : undefined;
  return s && s.value;
}

function formatter(method) {
  var cache = {};
  return function(_, specifier) {
    var f = cache[specifier] || (cache[specifier] = method(specifier));
    return f(_);
  };
}

function expressionFunctions(codegen) {
  var fn = functions(codegen);
  eventFunctions.forEach(function(name) {
    fn[name] = eventPrefix + name;
  });
  for (var name in extendedFunctions) {
    fn[name] = thisPrefix + name;
  }
  return fn;
}

function log(df, method, value, message) {
  try {
    df[method]('EXPRESSION' + (message ? ' ' + message : ''), value);
  } catch (err) {
    df.warn(err);
  }
  return value;
}

var _window = (typeof window !== 'undefined' && window) || null,
    _timeFormat = formatter(timeFormat),
    _date = new Date(2000, 0, 1),
    _time = function(month, day, specifier) {
        _date.setMonth(month);
        _date.setDate(day);
        return _timeFormat(_date, specifier);
      };

export var extendedFunctions = {
  format: formatter(format),
  utcFormat: formatter(utcFormat),
  timeFormat: _timeFormat,
  pad: pad,
  truncate: truncate,

  rgb: rgb,
  lab: lab,
  hcl: hcl,
  hsl: hsl,
  gradient: scaleGradient,

  monthFormat: function(month) {
      return _time(month, 1, '%B');
    },

  monthAbbrevFormat: function(month) {
      return _time(month, 1, '%b');
    },

  dayFormat: function(day) {
      return _time(0, 2 + day, '%A');
    },

  dayAbbrevFormat: function(day) {
      return _time(0, 2 + day, '%a');
    },

  quarter: function(date) {
      return 1 + ~~(new Date(date).getMonth() / 3);
    },

  utcquarter: function(date) {
      return 1 + ~~(new Date(date).getUTCMonth() / 3);
    },

  warn: function(value, message) {
      return log(this.context.dataflow, 'warn', value, message);
    },

  info: function(value, message) {
      return log(this.context.dataflow, 'info', value, message);
    },

  debug: function(value, message) {
      return log(this.context.dataflow, 'debug', value, message);
    },

  inScope: function(item) {
      var group = this.context.group,
          value = false;

      if (group) while (item) {
        if (item === group) { value = true; break; }
        item = item.mark.group;
      }
      return value;
    },

  clampRange: function(range, min, max) {
      var lo = range[0],
          hi = range[1],
          span;

      if (hi < lo) span = hi, hi = lo, lo = span;
      span = hi - lo;

      return [
        Math.min(Math.max(lo, min), max - span),
        Math.min(Math.max(hi, span), max)
      ];
    },

  pinchDistance: function() {
      return 'Math.sqrt('
        + 'Math.pow(event.touches[0].clientX - event.touches[1].clientX, 2) + '
        + 'Math.pow(event.touches[0].clientY - event.touches[1].clientY, 2)'
        + ')';
    },

  pinchAngle: function() {
      return 'Math.atan2('
        + 'event.touches[1].clientY - event.touches[0].clientY,'
        + 'event.touches[1].clientX - event.touches[0].clientX'
        + ')';
    },

  open: function(uri, name) {
      var df = this.context.dataflow;
      if (_window && _window.open) {
        df.loader().sanitize(uri, {context:'open', name:name})
          .then(function(url) { _window.open(url, name); })
          .catch(function(e) { df.warn('Open url failed: ' + e); });
      } else {
        df.warn('Open function can only be invoked in a browser.');
      }
    },

  screen: function() {
      return _window ? _window.screen : {};
    },

  windowsize: function() {
      return _window
        ? [_window.innerWidth, _window.innerHeight]
        : [undefined, undefined];
    },

  span: function(array) { return array[array.length-1] - array[0]; },

  range: function(name, group) {
      var s = getScale(name, (group || this).context);
      return s && s.range ? s.range() : [0, 0];
    },

  domain: function(name, group) {
      var s = getScale(name, (group || this).context);
      return s ? s.domain() : [];
    },

  bandwidth: function(name, group) {
      var s = getScale(name, (group || this).context);
      return s && s.bandwidth ? s.bandwidth() : 0;
    },

  bandspace: function(count, paddingInner, paddingOuter) {
      return bandSpace(count || 0, paddingInner || 0, paddingOuter || 0);
    },

  copy: function(name, group) {
      var s = getScale(name, (group || this).context);
      return s ? s.copy() : undefined;
    },

  scale:  function(name, value, group) {
      var s = getScale(name, (group || this).context);
      return s ? s(value) : undefined;
    },

  invert: function(name, range, group) {
      var s = getScale(name, (group || this).context);
      return !s ? undefined
        : isArray(range) ? (s.invertRange || s.invert)(range)
        : (s.invert || s.invertExtent)(range);
    },

  tuples: function(name) {
      var data = this.context.data[name];
      return data ? data.values.value : [];
    },

  indata: function(name, field, value) {
      var index = this.context.data[name]['index:' + field],
          entry = index ? index.value[value] : undefined;
      return entry ? entry.count : entry;
    },

  inrange: function(value, range) {
      var r0 = range[0], r1 = range[range.length-1], t;
      if (r0 > r1) t = r0, r0 = r1, r1 = t;
      return r0 <= value && value <= r1;
    },

  encode: function(item, name, retval) {
      if (item) {
        var df = this.context.dataflow,
            target = item.mark.source;
        df.pulse(target, df.changeset().encode(item, name));
      }
      return retval !== undefined ? retval : item;
    },

  modify: function(name, insert, remove, toggle, modify, values) {
      var df = this.context.dataflow,
          data = this.context.data[name],
          input = data.input,
          changes = data.changes,
          stamp = df.stamp(),
          predicate, key;

      if (!(input.value.length || insert || toggle)) {
        // nothing to do!
        return 0;
      }

      if (!changes || changes.stamp < stamp) {
        data.changes = (changes = df.changeset());
        changes.stamp = stamp;
        df.runAfter(function() { df.pulse(input, changes).run(); });
      }

      if (remove) {
        predicate = remove === true ? truthy
          : (isArray(remove) || remove._id != null) ? remove
          : removePredicate(remove);
        changes.remove(predicate);
      }

      if (insert) {
        changes.insert(insert);
      }

      if (toggle) {
        predicate = removePredicate(toggle);
        if (input.value.filter(predicate).length) {
          changes.remove(predicate);
        } else {
          changes.insert(toggle);
        }
      }

      if (modify) {
        for (key in values) {
          changes.modify(modify, key, values[key]);
        }
      }

      return 1;
    }
};

function removePredicate(props) {
  return function(_) {
    for (var key in props) {
      if (_[key] !== props[key]) return false;
    }
    return true;
  };
}

// AST visitors for dependency analysis

function scaleVisitor(name, args, scope, params) {
  if (args[0].type === Literal) { // scale dependency
    name = args[0].value;
    var scaleName = scalePrefix + name;

    if (!params.hasOwnProperty(scaleName)) {
      try {
        params[scaleName] = scope.scaleRef(name);
      } catch (err) {
        // TODO: error handling? warning?
      }
    }
  }

  else if (args[0].type === Identifier) { // forward reference to signal
    name = args[0].name;
    args[0] = new ASTNode(Literal);
    args[0].raw = '{signal:"' + name + '"}';
  }
}

function indataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to indata must be a string literal.');
  if (args[1].type !== Literal) error('Second argument to indata must be a string literal.');

  var data = args[0].value,
      field = args[1].value,
      indexName = indexPrefix + field;

  if (!params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field);
  }
}

function tuplesVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to tuples must be a string literal.');

  var data = args[0].value,
      dataName = tuplePrefix + data;

  if (!params.hasOwnProperty(dataName)) {
    params[dataName] = scope.getData(data).tuplesRef();
  }
}

function visitors() {
  var v = {
    indata: indataVisitor,
    tuples: tuplesVisitor
  };
  scaleFunctions.forEach(function(_) { v[_] = scaleVisitor; });
  return v;
}

// Export code generator parameters
export default {
  blacklist:  ['_'],
  whitelist:  ['datum', 'event'],
  fieldvar:   'datum',
  globalvar:  function(id) { return '_[' + stringValue('$' + id) + ']'; },
  functions:  expressionFunctions,
  constants:  constants,
  visitors:   visitors()
};
