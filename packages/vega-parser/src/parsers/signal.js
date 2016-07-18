import parseExpression from './expression';
import parseSelector from './event-selector';
import parseStream from './stream';
import {array, error, extend, isString} from 'vega-util';

export default function(signal, scope) {
  var op = scope.addSignal(signal.name, signal.value);
  if (signal.react === false) op.react = false;

  if (signal.update) {
    // TODO: in runtime, change update to {$expr, $params}?
    var expr = parseExpression(signal.update, scope);
    op.update = expr.$expr;
    if (expr.$params) op.params = expr.$params;
  }

  if (signal.on) {
    signal.on.forEach(function(_) {
      parseUpdate(_, scope, op.id);
    });
  }
}

function parseUpdate(spec, scope, target) {
  var events = spec.events,
      update = spec.update,
      sources = [],
      value, entry;

  if (!events) error('Signal update missing events specification.');

  // interpret as an event selector string
  if (isString(events)) {
    events = parseSelector(events);
  }

  // separate event streams from signal updates
  events = array(events).filter(function(stream) {
    return stream.signal ? (sources.push(stream), 0) : 1;
  });

  // merge event streams, include as source
  if (events.length) {
    sources.push(events.length > 1 ? {merge: events} : events[0]);
  }

  // TODO: default to string expr?
  value = update.expr != null ? parseExpression(update.expr, scope)
    : update.value != null ? update.value
    : update.signal != null ? {
        $expr: '_.value',
        $params: {value: scope.signalRef(update.signal)}
      }
    : error('Invalid signal update specification.');

  entry = {
    target: target,
    update: value
  };

  if (spec.force) {
    entry.options = {force: true};
  }

  sources.forEach(function(source) {
    source = {source: parseStream(source, scope)};
    scope.addUpdate(extend(source, entry));
  });
}
