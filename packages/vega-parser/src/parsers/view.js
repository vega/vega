import parseAutosize from './autosize';
import parsePadding from './padding';
import parseSignal from './signal';
import parseSpec from './spec';
import {encoders, extendEncode} from './encode/encode-util';
import {GroupMark} from './marks/marktypes';
import {FrameRole} from './marks/roles';
import {operator, ref, value} from '../util';
import DataScope from '../DataScope';
import {Bound, Collect, Encode, Render, Sieve, ViewLayout} from '../transforms';
import {array, extend, hasOwnProperty} from 'vega-util';

export default function parseView(spec, scope) {
  var config = scope.config,
      op, input, encode, parent, root, signals;

  // add scenegraph root
  root = ref(scope.root = scope.add(operator()));

  // parse top-level signal definitions
  signals = collectSignals(spec, config);
  signals.forEach(_ => parseSignal(_, scope));

  // assign description, event and legend configuration
  scope.description = spec.description || config.description;
  scope.eventConfig = config.events;
  scope.legends = scope.objectProperty(config.legend && config.legend.layout);

  // store root group item
  input = scope.add(Collect());

  // encode root group item
  encode = extendEncode({
    enter: { x: {value: 0}, y: {value: 0} },
    update: { width: {signal: 'width'}, height: {signal: 'height'} }
  }, spec.encode);

  encode = scope.add(Encode(
    encoders(encode, GroupMark, FrameRole, spec.style, scope, {pulse: ref(input)}))
  );

  // perform view layout
  parent = scope.add(ViewLayout({
    layout:   scope.objectProperty(spec.layout),
    legends:  scope.legends,
    autosize: scope.signalRef('autosize'),
    mark:     root,
    pulse:    ref(encode)
  }));
  scope.operators.pop();

  // parse remainder of specification
  scope.pushState(ref(encode), ref(parent), null);
  parseSpec(spec, scope, signals);
  scope.operators.push(parent);

  // bound / render / sieve root item
  op = scope.add(Bound({mark: root, pulse: ref(parent)}));
  op = scope.add(Render({pulse: ref(op)}));
  op = scope.add(Sieve({pulse: ref(op)}));

  // track metadata for root item
  scope.addData('root', new DataScope(scope, input, input, op));

  return scope;
}

function signalObject(name, value) {
  return value && value.signal
    ? { name, update: value.signal }
    : { name, value };
}

/**
 * Collect top-level signals, merging values as needed. Signals
 * defined in the config signals arrays are added only if that
 * signal is not explicitly defined in the specification.
 * Built-in signals (autosize, background, padding, width, height)
 * receive special treatment. They are initialized using the
 * top-level spec property, or, if undefined in the spec, using
 * the corresponding top-level config property. If this property
 * is a signal reference object, the signal expression maps to the
 * signal 'update' property. If the spec's top-level signal array
 * contains an entry that matches a built-in signal, that entry
 * will be merged with the built-in specification, potentially
 * overwriting existing 'value' or 'update' properties.
 */
function collectSignals(spec, config) {
  const _ = name => value(spec[name], config[name]),
        signals = [
          signalObject('background', _('background')),
          signalObject('autosize', parseAutosize(_('autosize'))),
          signalObject('padding', parsePadding(_('padding'))),
          signalObject('width', _('width') || 0),
          signalObject('height', _('height') || 0)
        ],
        pre = signals.reduce((p, s) => (p[s.name] = s, p), {}),
        map = {};

  // add spec signal array
  array(spec.signals).forEach(s => {
    if (hasOwnProperty(pre, s.name)) {
      // merge if built-in signal
      s = extend(pre[s.name], s);
    } else {
      // otherwise add to signal list
      signals.push(s);
    }
    map[s.name] = s;
  });

  // add config signal array
  array(config.signals).forEach(s => {
    if (!hasOwnProperty(map, s.name) && !hasOwnProperty(pre, s.name)) {
      // add to signal list if not already defined
      signals.push(s);
    }
  });

  return signals;
}
