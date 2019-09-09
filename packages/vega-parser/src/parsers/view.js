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

var defined = toSet(['width', 'height', 'padding', 'autosize']);

export default function parseView(spec, scope) {
  var config = scope.config,
      op, input, encode, parent, root, signals;

  scope.background = spec.background || config.background;
  scope.eventConfig = config.events;
  root = ref(scope.root = scope.add(operator()));
  scope.addSignal('width', spec.width || 0);
  scope.addSignal('height', spec.height || 0);
  scope.addSignal('padding', parsePadding(spec.padding, config));
  scope.addSignal('autosize', parseAutosize(spec.autosize, config));
  scope.legends = scope.objectProperty(config.legend && config.legend.layout);

  // parse signal definitions, including config entries
  signals = addSignals(scope, spec.signals, config.signals);

  // Store root group item
  input = scope.add(Collect());

  // Encode root group item
  encode = extendEncode({
    enter: { x: {value: 0}, y: {value: 0} },
    update: { width: {signal: 'width'}, height: {signal: 'height'} }
  }, spec.encode);

  encode = scope.add(Encode(
    encoders(encode, GroupMark, FrameRole, spec.style, scope, {pulse: ref(input)}))
  );

  // Perform view layout
  parent = scope.add(ViewLayout({
    layout:       scope.objectProperty(spec.layout),
    legends:      scope.legends,
    autosize:     scope.signalRef('autosize'),
    mark:         root,
    pulse:        ref(encode)
  }));
  scope.operators.pop();

  // Parse remainder of specification
  scope.pushState(ref(encode), ref(parent), null);
  parseSpec(spec, scope, signals);
  scope.operators.push(parent);

  // Bound / render / sieve root item
  op = scope.add(Bound({mark: root, pulse: ref(parent)}));
  op = scope.add(Render({pulse: ref(op)}));
  op = scope.add(Sieve({pulse: ref(op)}));

  // Track metadata for root item
  scope.addData('root', new DataScope(scope, input, input, op));

  return scope;
}

function addSignals(scope, signals, config) {
  // signals defined in the spec take priority
  array(signals).forEach(_ => {
    if (!defined[_.name]) parseSignal(_, scope)
  });

  if (!config) return signals;
  const out = array(signals).slice();

  // add config signals if not already defined
  array(config).forEach(_ => {
    if (!scope.hasOwnSignal(_.name)) {
      parseSignal(_, scope);
      out.push(_);
    }
  });

  return out;
}
