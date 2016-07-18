import {array, error} from 'vega-util';

var View = 'view';

export default function(stream, scope) {
  return stream.signal
    ? scope.getSignal(stream.signal).id
    : parseStream(stream, scope);
}

function parseStream(stream, scope) {
  var method = stream.merge ? mergeStream
    : stream.type ? eventStream
    : error('Invalid stream specification: ' + JSON.stringify(stream));

  return method(stream, scope);
}

function mergeStream(stream, scope) {
  var list = stream.merge.map(function(s) {
    return parseStream(s, scope);
  });

  var entry = streamParameters({merge: list}, stream, scope);
  return scope.addStream(entry).id;
}

function eventStream(stream, scope) {
  var id = scope.event(stream.source || View, stream.type),
      entry = streamParameters({stream: id}, stream, scope);
  return Object.keys(entry).length === 1 ? id
    : scope.addStream(entry).id;
}

function streamParameters(entry, stream, scope) {
  var param, mark;

  if (param = stream.between) {
    if (param.length !== 2) {
      error('Stream between parameter must have 2 entries.');
    }
    entry.between = [
      parseStream(param[0], scope),
      parseStream(param[1], scope)
    ];
  }

  mark = stream.mark || stream.name;
  if (stream.filter || mark) {
    param = stream.filter ? array(stream.filter) : [];
    if (mark) {
      param.push(filterMark(stream.mark, stream.name));
    }
    entry.filter = '(' + param.join(')&&(') + ')';
    // TODO: run through expression parser...
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

function filterMark(type, name) {
  return 'event.item'
    + (type && type !== 'item' ? '&&event.item.mark.marktype===\'' + type + '\'' : '')
    + (name ? '&&event.item.mark.name===\'' + name + '\'' : '');
}
