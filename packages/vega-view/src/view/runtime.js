import formats from './formats';
import {transforms} from 'vega-dataflow';
import {isArray, isObject, isString, pad, truncate, truthy} from 'vega-util';
import {parse, context} from 'vega-runtime';
import {scaleGradient} from 'vega-scenegraph';
import {rgb, lab, hcl, hsl} from 'd3-color';

function scale(name, ctx) {
  var s = isString(name) ? ctx.scales[name]
    : isObject(name) && name.signal ? ctx.signals[name.signal]
    : undefined;
  return s && s.value;
}

function functions() {
  var fn = formats();
  fn.pad = pad;
  fn.truncate = truncate;

  fn.rgb = rgb;
  fn.lab = lab;
  fn.hcl = hcl;
  fn.hsl = hsl;
  fn.gradient = scaleGradient;

  fn.clampRange = function(range, min, max) {
    var lo = range[0],
        hi = range[1],
        span;

    if (hi < lo) span = hi, hi = lo, lo = span;
    span = hi - lo;

    return [
      Math.min(Math.max(lo, min), max - span),
      Math.min(Math.max(hi, span), max)
    ];
  };

  fn.pinchDistance = function() {
    return 'Math.sqrt('
      + 'pow(event.touches[0].clientX - event.touches[1].clientX, 2) + '
      + 'pow(event.touches[0].clientY - event.touches[1].clientY, 2)'
      + ')';
  };

  fn.pinchAngle = function() {
    return 'Math.atan2('
      + 'event.touches[1].clientY - event.touches[0].clientY,'
      + 'event.touches[1].clientX - event.touches[0].clientX'
      + ')';
  };

  fn.open = function(uri, name) {
    var df = this.context.dataflow;
    if (typeof window !== 'undefined' && window && window.open) {
      df.loader().sanitize(uri, {context:'open', name:name})
        .then(function(url) { window.open(url, name); })
        .catch(function(e) { df.warn('Open url failed: ' + e); });
    } else {
      df.warn('Open function can only be invoked in a browser.');
    }
  };

  fn.span = function(array) {
    return array[array.length-1] - array[0];
  };

  fn.range = function(name, group) {
    var s = scale(name, (group || this).context);
    return s && s.range ? s.range() : [0, 0];
  };

  fn.bandwidth = function(name, group) {
    var s = scale(name, (group || this).context);
    return s && s.bandwidth ? s.bandwidth() : 0;
  };

  fn.scaleCopy = function(name, group) {
    var s = scale(name, (group || this).context);
    return s ? s.copy() : undefined;
  };

  fn.scale = function(name, value, group) {
    var s = scale(name, (group || this).context);
    return s ? s(value) : undefined;
  };

  fn.scaleInvert = function(name, range, group) {
    var s = scale(name, (group || this).context);
    return !s ? undefined
      : isArray(range) ? (s.invertRange || s.invert)(range)
      : (s.invert || s.invertExtent)(range);
  };

  fn.indata = function(name, field, value) {
    var index = this.context.data[name]['index:' + field],
        entry = index ? index.value[value] : undefined;
    return entry ? entry.count : entry;
  };

  fn.inrange = function(value, range) {
    var r0 = range[0], r1 = range[range.length-1], t;
    if (r0 > r1) t = r0, r0 = r1, r1 = t;
    return r0 <= value && value <= r1;
  };

  fn.encode = function(item, name, retval) {
    if (item) {
      var df = this.context.dataflow,
          target = item.mark.source;
      df.pulse(target, df.changeset().encode(item, name));
    }
    return retval !== undefined ? retval : item;
  };

  fn.modify = function(name, insert, remove, toggle, modify, values) {
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
      changes.remove(remove === true ? truthy : remove);
    }

    if (insert) {
      changes.insert(insert);
    }

    if (toggle) {
      predicate = function(_) {
        for (key in toggle) {
          if (_[key] !== toggle[key]) return false;
        }
        return true;
      };

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
  };

  return fn;
}

export default function(view, spec) {
  return parse(spec, context(view, transforms, functions()));
}
