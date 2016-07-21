import {ref, operator, transform} from '../util';
import DataScope from '../DataScope';
import parseSignalUpdates from './signal-updates';
import parseProjection from './projection';
import parsePadding from './padding';
import parseSignal from './signal';
import parseScale from './scale';
import parseData from './data';
import parseMark from './mark';
import parseAxis from './axis';
import {array, toSet} from 'vega-util';

var predefined = toSet(['width', 'height', 'padding']);

export default function parseView(spec, scope) {
  var op, input, root, children;

  root = ref(scope.root = scope.add(operator()));
  scope.addSignal('width', spec.width || -1);
  scope.addSignal('height', spec.height || -1);
  scope.addSignal('padding', parsePadding(spec.padding));

  // Store root item
  input = scope.add(transform('Collect'));

  // Encode root item width/height
  // TODO: run through proper encoding, with user configurable options
  op = scope.add(transform('Encode', {
    encoders: {
      $encode: {
        enter: {
          $expr: "var o=item;o.x=0,o.y=0;o.width=_.width;o.height=_.height;return(1);"
        },
        update: {
          $expr: "var o=item;o.width=_.width;o.height=_.height;return(1);"
        }
      }
    },
    width: scope.signalRef('width'),
    height: scope.signalRef('height'),
    pulse: ref(input)
  }));

  // Parse remainder of specification
  children = parseSpec(spec, scope);

  // Perform chart layout
  op = scope.add(transform('ChartLayout', {
    mark:  root,
    pulse: ref(op)
  }));

  // Bound root item
  op = scope.add(transform('Bound', {
    mark:     root,
    children: children,
    pulse:    ref(op)
  }));

  // Render root item
  op = scope.add(transform('Render', {pulse: ref(op)}));

  // Root item vlaues
  op = scope.add(transform('Sieve', {pulse: ref(op)}));

  // Track metadata for root item
  scope.addData('root', new DataScope(scope, input, input, op));
}

function parseSpec(spec, scope) {
  var children = [],
      signals = array(spec.signals);

  signals.forEach(function(_) {
    if (!predefined[_.name]) parseSignal(_, scope);
  });

  array(spec.projections).forEach(function(_) {
    parseProjection(_, scope);
  });

  array(spec.data).forEach(function(_) {
    parseData(_, scope);
  });

  array(spec.scales).forEach(function(_) {
    parseScale(_, scope);
  });

  signals.forEach(function(_) {
    parseSignalUpdates(_, scope);
  });

  array(spec.axes).forEach(function(_) {
    children.push(parseAxis(_, scope));
  });

  array(spec.marks).forEach(function(_) {
    children.push(parseMark(_, scope));
  });

  return children;
}
