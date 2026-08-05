import {Scope, View} from '../util.js';
import {parseExpression} from 'vega-functions';
import {error, stringValue} from 'vega-util';

const Timer = 'timer';

export default function parseStream(stream, scope) {
  const method = stream.merge ? mergeStream
    : stream.stream ? nestedStream
    : stream.type ? eventStream
    : error('Invalid stream specification: ' + stringValue(stream));

  return method(stream, scope);
}

function eventSource(source) {
   return source === Scope ? View : (source || View);
}

function mergeStream(stream, scope) {
  const list = stream.merge.map(s => parseStream(s, scope)),
        entry = streamParameters({merge: list}, stream, scope);
  return scope.addStream(entry).id;
}

function nestedStream(stream, scope) {
  const id = parseStream(stream.stream, scope),
        entry = streamParameters({stream: id}, stream, scope);
  return scope.addStream(entry).id;
}

function eventStream(stream, scope) {
  let id;
  if (stream.type === Timer) {
    id = scope.event(Timer, stream.throttle);
    stream = {between: stream.between, filter: stream.filter};
  } else {
    id = scope.event(eventSource(stream.source), stream.type);
  }

  const entry = streamParameters({stream: id}, stream, scope);
  return Object.keys(entry).length === 1
    ? id
    : scope.addStream(entry).id;
}

function streamParameters(entry, stream, scope) {
  let param = stream.between;

  if (param) {
    if (param.length !== 2) {
      error('Stream "between" parameter must have 2 entries: ' + stringValue(stream));
    }
    entry.between = [
      parseStream(param[0], scope),
      parseStream(param[1], scope)
    ];
  }

  param = stream.filter ? [].concat(stream.filter) : [];
  if (stream.marktype || stream.markname || stream.markrole) {
    // add filter for mark type, name and/or role
    param.push(filterMark(stream.marktype, stream.markname, stream.markrole));
  }
  if (stream.source === Scope) {
    // add filter to limit events from sub-scope only
    param.push('inScope(event.item)');
  }
  if (param.length) {
    entry.filter = parseExpression('(' + param.join(')&&(') + ')', scope).$expr;
  }

  if ((param = stream.throttle) != null) {
    entry.throttle = +param;
  }

  if ((param = stream.debounce) != null) {
    entry.debounce = +param;
  }

  if (stream.consume) {
    entry.consume = true;
  }

  return entry;
}

function filterMark(type, name, role) {
  const item = 'event.item';
  return item
    + (type && type !== '*' ? '&&' + item + '.mark.marktype===\'' + type + '\'' : '')
    + (role ? '&&' + item + '.mark.role===\'' + role + '\'' : '')
    + (name ? '&&' + item + '.mark.name===\'' + name + '\'' : '');
}
