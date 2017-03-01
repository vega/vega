import parseAutosize from './autosize';
import parsePadding from './padding';
import parseSignal from './signal';
import parseSpec from './spec';
import {encoders, extendEncode} from './encode/encode-util';
import {GroupMark} from './marks/marktypes';
import {FrameRole} from './marks/roles';
import {ref, operator} from '../util';
import DataScope from '../DataScope';
import {Bound, Collect, Encode, Render, Sieve, ViewLayout} from '../transforms';
import {array, toSet} from 'vega-util';

var defined = toSet(['width', 'height', 'padding']);

export default function parseView(spec, scope) {
  var config = scope.config,
      op, input, encode, parent, root;

  scope.background = spec.background || config.background;
  root = ref(scope.root = scope.add(operator()));
  scope.addSignal('width', spec.width || -1);
  scope.addSignal('height', spec.height || -1);
  scope.addSignal('padding', parsePadding(spec.padding, config));

  array(spec.signals).forEach(function(_) {
    if (!defined[_.name]) parseSignal(_, scope);
  });

  // Store root group item
  input = scope.add(Collect());

  // Encode root group item
  encode = extendEncode({
    enter: { x: {value: 0}, y: {value: 0} },
    update: { width: {signal: 'width'}, height: {signal: 'height'} }
  }, spec.encode);

  encode = scope.add(Encode(
    encoders(encode, GroupMark, FrameRole, scope, {pulse: ref(input)}))
  );

  // Perform view layout
  parent = scope.add(ViewLayout({
    legendMargin: config.legendMargin,
    autosize:     parseAutosize(spec.autosize, config),
    mark:         root,
    pulse:        ref(encode)
  }));

  // Parse remainder of specification
  scope.pushState(ref(encode), ref(parent), null);
  parseSpec(spec, scope, true);

  // Bound / render / sieve root item
  op = scope.add(Bound({mark: root, pulse: ref(parent)}));
  op = scope.add(Render({pulse: ref(op)}));
  op = scope.add(Sieve({pulse: ref(op)}));

  // Track metadata for root item
  scope.addData('root', new DataScope(scope, input, input, op));

  return scope;
}
