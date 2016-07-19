import * as transforms from '../transforms/index';

import {
  parse,
  context
} from 'vega-runtime';

import {
  rgb,
  lab,
  hcl,
  hsl
} from 'd3-color';

function functions(fn, ctx) {
  fn.rgb = rgb;
  fn.lab = lab;
  fn.hcl = hcl;
  fn.hsl = hsl;

  fn.scale = function(name, value) {
    var s = ctx.scales[name];
    return s ? s.value(value) : undefined;
  };

  fn.scaleInvert = function(name, value) {
    var s = ctx.scales[name];
    return s ? s.value.invert(value) : undefined;
  };

  fn.scaleCopy = function(source, target) {
    var s = ctx.scales[source],
        t = ctx.scales[target];
    return (s && t)
      ? null // TODO: perform copy
      : undefined;
  };

  fn.indata = function(name, field, value) {
    var index = ctx.data['index:' + field];
    return index ? !!index.value.get(value) : undefined;
  };

  return ctx;
}

export default function(view, spec) {
  var fn = {},
      ctx = context(view, transforms, fn);
  return parse(spec, functions(fn, ctx));
}
