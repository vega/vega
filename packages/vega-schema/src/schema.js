import {def, numberOrSignal, objectType, stringType, type} from './util.js';

import autosize from './autosize.js';
import axis from './axis.js';
import background from './background.js';
import bind from './bind.js';
import data from './data.js';
import encode from './encode.js';
import expr from './expr.js';
import layout from './layout.js';
import legend from './legend.js';
import mark from './mark.js';
import marktype from './marktype.js';
import onEvents from './on-events.js';
import onTrigger from './on-trigger.js';
import padding from './padding.js';
import projection from './projection.js';
import scale from './scale.js';
import scope from './scope.js';
import selector from './selector.js';
import signal from './signal.js';
import stream from './stream.js';
import title from './title.js';
import transform from './transform.js';

function extend(target, source) {
  for (const key in source) {
    target[key] = source[key];
  }
}

function addModule(schema, module) {
  extend(schema.definitions, module);
}

export default function(definitions) {
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Vega Visualization Specification Language',
    definitions: {},
    type: 'object',
    allOf: [
      def('scope'),
      {
        properties: {
          $schema: type('string', {format: 'uri'}),
          config: objectType,
          description: stringType,
          width: numberOrSignal,
          height: numberOrSignal,
          padding: def('padding'),
          autosize: def('autosize'),
          background: def('background'),
          style: def('style')
        }
      }
    ]
  };

  [
    autosize,
    axis,
    background,
    bind,
    data,
    encode,
    expr,
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
    transform(definitions)
  ].forEach(module => {
    addModule(schema, module);
  });

  return schema;
}
