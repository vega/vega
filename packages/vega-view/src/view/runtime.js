import formats from './formats';
import {transforms} from 'vega-dataflow';
import {extend, isArray, isObject, isString} from 'vega-util';
import {parse, context} from 'vega-runtime';
import {rgb, lab, hcl, hsl} from 'd3-color';

function scale(name, ctx) {
  var s = isString(name) ? ctx.scales[name]
    : isObject(name) && name.signal ? ctx.signals[name.signal]
    : undefined;
  return s && s.value;
}

function functions(fn, ctx) {
  extend(fn, formats());

  fn.rgb = rgb;
  fn.lab = lab;
  fn.hcl = hcl;
  fn.hsl = hsl;

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

  fn.span = function(array) {
    return array[array.length-1] - array[0];
  };

  fn.range = function(name) {
    var s = scale(name, ctx);
    return s && s.range() ? s.range() : [0, 0];
  };

  fn.scale = function(name, value) {
    var s = scale(name, ctx);
    return s ? s(value) : undefined;
  };

  fn.scaleInvert = function(name, range) {
    var s = scale(name, ctx);
    return !s ? undefined
      : isArray(range) ? (s.invertRange || s.invert)(range)
      : (s.invert || s.invertExtent)(range);
  };

  fn.scaleCopy = function(name) {
    var s = scale(name, ctx);
    return s ? s.copy() : undefined;
  };

  fn.indata = function(name, field, value) {
    var index = ctx.data['index:' + field];
    return index ? !!index.value.get(value) : undefined;
  };

  fn.encode = function(item, name, retval) {
    if (item) {
      var df = ctx.dataflow,
          target = item.mark.source;
      df.pulse(target, df.changeset().encode(item, name));
    }
    return retval !== undefined ? retval : item;
  };

  return ctx;
}

export default function(view, spec) {
  var fn = {},
      ctx = context(view, transforms, fn);
  return parse(spec, functions(fn, ctx));
}
