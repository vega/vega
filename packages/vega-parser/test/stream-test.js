var tape = require('tape'),
    vega = require('../');

tape('Parser parses stream definitions', function(test) {
  var scope = new vega.Scope(),
      dom, view, between, merge, signal, stream;

  scope.addSignal('drag', true);

  dom = vega.stream({
    source:   'window',
    type:     'mousemove',
    filter:   'event.metaKey',
    throttle: 1,
    debounce: 2
  }, scope);

  view = vega.stream({
    type:     'mousedown',
    marktype: 'rect',
    markname: 'foo',
    filter:   'event.shiftKey',
    throttle: 3,
    debounce: 4
  }, scope);

  between = vega.stream({
    source:   'window',
    type:     'mousemove',
    between:  [
      {source: 'view', type: 'mousedown'},
      {source: 'view', type: 'mouseup'}
    ]
  }, scope);

  merge = vega.stream({
    merge: [
      {source: 'view', type: 'mousedown'},
      {source: 'view', type: 'mouseup'}
    ]
  }, scope);

  signal = vega.stream({
    signal: 'drag'
  }, scope);


  test.equal(scope.streams.length, 7);

  test.equal(signal, 0);

  stream = scope.streams[0];
  test.equal(stream.id, 1);
  test.equal(stream.source, 'window');
  test.equal(stream.type, 'mousemove');
  test.equal(stream.stream, undefined);
  test.equal(stream.merge, undefined);
  test.equal(stream.between, undefined);
  test.equal(stream.filter, undefined);
  test.equal(stream.throttle, undefined);
  test.equal(stream.debounce, undefined);

  stream = scope.streams[1];
  test.equal(stream.id, dom);
  test.equal(stream.source, undefined);
  test.equal(stream.type, undefined);
  test.equal(stream.stream, 1);
  test.equal(stream.merge, undefined);
  test.equal(stream.between, undefined);
  test.equal(stream.filter, '(event.metaKey)');
  test.equal(stream.throttle, 1);
  test.equal(stream.debounce, 2);

  stream = scope.streams[2];
  test.equal(stream.id, 3);
  test.equal(stream.source, 'view');
  test.equal(stream.type, 'mousedown');
  test.equal(stream.stream, undefined);
  test.equal(stream.merge, undefined);
  test.equal(stream.between, undefined);
  test.equal(stream.filter, undefined);
  test.equal(stream.throttle, undefined);
  test.equal(stream.debounce, undefined);

    // TODO mark, name
  stream = scope.streams[3];
  test.equal(stream.id, view);
  test.equal(stream.source, undefined);
  test.equal(stream.type, undefined);
  test.equal(stream.stream, 3);
  test.equal(stream.merge, undefined);
  test.equal(stream.between, undefined);
  test.equal(stream.filter, "(event.shiftKey)&&(event.item&&event.item.mark.marktype==='rect'&&event.item.mark.name==='foo')");
  test.equal(stream.throttle, 3);
  test.equal(stream.debounce, 4);

  stream = scope.streams[4];
  test.equal(stream.id, 5);
  test.equal(stream.source, 'view');
  test.equal(stream.type, 'mouseup');
  test.equal(stream.stream, undefined);
  test.equal(stream.merge, undefined);
  test.equal(stream.between, undefined);
  test.equal(stream.filter, undefined);
  test.equal(stream.throttle, undefined);
  test.equal(stream.debounce, undefined);

  stream = scope.streams[5];
  test.equal(stream.id, between);
  test.equal(stream.source, undefined);
  test.equal(stream.type, undefined);
  test.equal(stream.stream, 1);
  test.equal(stream.merge, undefined);
  test.deepEqual(stream.between, [3,5]);
  test.equal(stream.filter, undefined);
  test.equal(stream.throttle, undefined);
  test.equal(stream.debounce, undefined);

  stream = scope.streams[6];
  test.equal(stream.id, merge);
  test.equal(stream.source, undefined);
  test.equal(stream.type, undefined);
  test.equal(stream.stream, undefined);
  test.deepEqual(stream.merge, [3,5]);
  test.equal(stream.between, undefined);
  test.equal(stream.filter, undefined);
  test.equal(stream.throttle, undefined);
  test.equal(stream.debounce, undefined);

  test.end();
});
