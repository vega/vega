import parsePadding from './padding';
import parseSpec from './spec';
import {ref, operator, transform} from '../util';
import DataScope from '../DataScope';
import {toSet} from 'vega-util';

export default function parseView(spec, scope) {
  var op, input, encode, parent, root;

  root = ref(scope.root = scope.add(operator()));
  scope.addSignal('width', spec.width || -1);
  scope.addSignal('height', spec.height || -1);
  scope.addSignal('padding', parsePadding(spec.padding));

  // Store root item
  input = scope.add(transform('Collect'));

  // Encode root item width/height
  // TODO: run through proper encoding, with user configurable options
  encode = scope.add(transform('Encode', {
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

  // Perform view layout
  parent = scope.add(transform('ViewLayout', {
    legendMargin: scope.config.legendMargin,
    autosize:     spec.autosize || scope.config.autosize,
    mark:         root,
    pulse:        ref(encode)
  }));

  // Parse remainder of specification
  scope.pushState(ref(encode), ref(parent));
  parseSpec(spec, scope, toSet(['width', 'height', 'padding']));

  // Bound / render / sieve root item
  op = scope.add(transform('Bound', {mark: root, pulse: ref(parent)}));
  op = scope.add(transform('Render', {pulse: ref(op)}));
  op = scope.add(transform('Sieve', {pulse: ref(op)}));

  // Track metadata for root item
  scope.addData('root', new DataScope(scope, input, input, op));

  return scope;
}
