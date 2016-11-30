import autosize from './autosize';
import axis from './axis';
import background from './background';
import bind from './bind';
import data from './data';
import encode from './encode';
import expr from './expr';
import legend from './legend';
import mark from './mark';
import marktype from './marktype';
import onEvents from './on-events';
import onTrigger from './on-trigger';
import padding from './padding';
import projection from './projection';
import scale from './scale';
import scope from './scope';
import selector from './selector';
import signal from './signal';
import spec from './spec';
import stream from './stream';
import transform from './transform';

function extend(target, source) {
  for (var key in source) {
    target[key] = source[key];
  }
}

function addModule(schema, module) {
  if (module.refs) extend(schema.refs, module.refs);
  if (module.defs) extend(schema.defs, module.defs);
}

export default function(definitions) {
  var schema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "Vega 3.0 Visualization Specification Language",
    "defs": {},
    "refs": {},
    "$ref": "#/defs/spec"
  };

  [
    autosize,
    axis,
    background,
    bind,
    data,
    encode,
    expr,
    legend,
    mark,
    marktype,
    onEvents,
    onTrigger,
    padding,
    projection,
    scale,
    scope,
    selector,
    signal,
    spec,
    stream,
    transform(definitions)
  ].forEach(function(module) {
    addModule(schema, module);
  });

  return schema;
}
