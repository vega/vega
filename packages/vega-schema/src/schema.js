import {def, ref, type, stringType} from './util';

import autosize from './autosize';
import axis from './axis';
import background from './background';
import bind from './bind';
import config from './config'
import data from './data';
import encode from './encode';
import expr from './expr';
import height from './height';
import layout from './layout';
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
import stream from './stream';
import title from './title';
import transform from './transform';
import usermeta from './usermeta'
import width from './width';

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
    $schema: 'http://json-schema.org/draft-06/schema#',
    title: 'Vega Visualization Specification Language',
    defs: {},
    refs: {},
    type: 'object',
    allOf: [
      def('scope'),
      {
        properties: {
          $schema: type('string', {format: 'uri'}),
          usermeta: def('usermeta'),
          config: def('config'),
          description: stringType,
          width: def('width'),
          height: def('height'),
          padding: def('padding'),
          autosize: def('autosize'),
          background: def('background'),
          style: ref('style')
        }
      }
    ]
  };

  [
    autosize,
    axis,
    background,
    bind,
    config,
    data,
    encode,
    expr,
    height,
    layout,
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
    stream,
    title,
    usermeta,
    width,
    transform(definitions)
  ].forEach(function(module) {
    addModule(schema, module);
  });

  return schema;
}
