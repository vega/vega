import parseExpression from './expression';
import parseStream from './stream';
import {Scope, View} from '../util';
import {selector} from 'vega-event-selector';
import {array, error, extend, isString, stringValue} from 'vega-util';

var preamble = 'var datum=event.item&&event.item.datum;';

export default function(spec, scope, target) {
  var events = spec.events,
      update = spec.update,
      encode = spec.encode,
      sources = [],
      value = '', entry;

  if (!events) {
    error('Signal update missing events specification.');
  }

  // interpret as an event selector string
  if (isString(events)) {
    events = selector(events, scope.isSubscope() ? Scope : View);
  }

  // separate event streams from signal updates
  events = array(events).filter(function(stream) {
    if (stream.signal || stream.scale) {
      sources.push(stream);
      return 0;
    } else {
      return 1;
    }
  });

  // merge event streams, include as source
  if (events.length) {
    sources.push(events.length > 1 ? {merge: events} : events[0]);
  }

  if (encode != null) {
    if (update) error('Signal encode and update are mutually exclusive.');
    update = 'encode(item(),' + stringValue(encode) + ')';
  }

  // resolve update value
  value = isString(update) ? parseExpression(update, scope, preamble)
    : update.expr != null ? parseExpression(update.expr, scope, preamble)
    : update.value != null ? update.value
    : update.signal != null ? {
        $expr:   '_.value',
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
    scope.addUpdate(extend(streamSource(source, scope), entry));
  });
}

function streamSource(stream, scope) {
  return {
    source: stream.signal ? scope.signalRef(stream.signal)
          : stream.scale ? scope.scaleRef(stream.scale)
          : parseStream(stream, scope)
  };
}
