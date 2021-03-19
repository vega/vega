var tape = require('tape'),
    vega = require('../');

function parseSignal(spec, scope) {
  vega.signal(spec, scope);
  vega.signalUpdates(spec, scope);
}

tape('Parser parses static signals', t => {
  const scope = new vega.Scope();

  vega.signal({name: 'a', value: 'foo'}, scope);
  vega.signal({name: 'b', value: 'bar', react: true}, scope);
  vega.signal({name: 'c', value: 'baz', react: false}, scope);

  t.equal(scope.operators.length, 3);
  t.equal(Object.keys(scope.signals).length, 3);
  t.equal(scope.signals.a.value, 'foo');
  t.equal(scope.signals.b.value, 'bar');
  t.equal(scope.signals.c.value, 'baz');
  t.equal(scope.signals.a.react, undefined);
  t.equal(scope.signals.b.react, undefined);
  t.equal(scope.signals.c.react, false);

  t.end();
});

tape('Parser parses updating signals', t => {
  const scope = new vega.Scope();

  parseSignal({name: 'a', update: '5 * 2'}, scope);
  parseSignal({name: 'b', update: 'a + 3'}, scope);

  t.equal(Object.keys(scope.signals).length, 2);
  t.equal(scope.signals.a.id, 0);
  t.equal(scope.signals.a.value, undefined);
  t.equal(scope.signals.a.update.code, '(5 * 2)');
  t.deepEqual(scope.signals.a.params, {});
  t.equal(scope.signals.b.id, 1);
  t.equal(scope.signals.b.value, undefined);
  t.equal(scope.signals.b.update.code, '(_["$a"] + 3)');
  t.deepEqual(scope.signals.b.params, {$a: {$ref: 0}});
  t.end();
});

tape('Parser parses signals with event-driven updates', t => {
  var scope = new vega.Scope(),
      update, a, b, c, d;

  scope.addSignal('a', 1);

  // single event stream, constant update value, force true
  parseSignal({
    name: 'b',
    value: 2,
    on: [
      {
        events: {source: 'window', type: 'mouseover'},
        update: {value: 4},
        force: true
      }
    ]
  }, scope);

  // event stream array, expression update value, force false
  parseSignal({
    name: 'c',
    value: 3,
    on: [
      {
        events: [
          {source: 'window', type: 'mouseover'},
          {source: 'window', type: 'touchstart'},
          {signal: 'a'}
        ],
        update: {expr: '2 * 2'},
        force: false
      }
    ]
  }, scope);

  // signal update value, selector string
  parseSignal({
    name: 'd',
    value: 4,
    on: [
      {
        events: 'window:mouseover',
        update: {signal: 'c'}
      }
    ]
  }, scope);

  t.equal(Object.keys(scope.signals).length, 4);
  t.equal(a = scope.signals.a.id, 0);
  t.equal(b = scope.signals.b.id, 1);
  t.equal(c = scope.signals.c.id, 3);
  t.equal(d = scope.signals.d.id, 6);
  t.equal(scope.signals.a.value, 1);
  t.equal(scope.signals.b.value, 2);
  t.equal(scope.signals.c.value, 3);
  t.equal(scope.signals.d.value, 4);

  t.equal(scope.updates.length, 4);

  update = scope.updates[0];
  t.equal(update.source, 2);
  t.equal(update.target, b);
  t.equal(update.update, 4);
  t.equal(update.options.force, true);

  update = scope.updates[1];
  t.equal(update.source && update.source.$ref, a);
  t.equal(update.target, c);
  t.equal(update.update.$expr.code, '(2 * 2)');
  t.equal(update.options, undefined);

  update = scope.updates[2];
  t.equal(update.source, 5);
  t.equal(update.target, c);
  t.equal(update.update.$expr.code, '(2 * 2)');
  t.equal(update.options, undefined);

  update = scope.updates[3];
  t.equal(update.source, 2);
  t.equal(update.target, d);
  t.equal(update.update.$expr.code, '_.$value');
  t.equal(update.update.$params.$value.$ref, c);
  t.equal(update.options, undefined);

  t.end();
});

function testSignals(t, df, signals) {
  df.operators.forEach(o => {
    var s = signals[o.signal], key;
    if (!s) return;
    for (key in s) {
      t.deepEqual(o[key], s[key]);
    }
  });
}

tape('Parser handles built-in signals', t => {
  // empty spec should get default values
  testSignals(t, vega.parse({}), {
    background: {value: null},
    autosize: {value: {type: 'pad'}},
    padding: {value: {top: 0, bottom: 0, left: 0, right: 0}},
    width: {value: 0},
    height: {value: 0}
  });

  // config constants should be used
  testSignals(t, vega.parse({
    config: {
      background: 'blue',
      autosize: 'none',
      padding: 7,
      width: 400,
      height: 300
    }
  }), {
    background: {value: 'blue'},
    autosize: {value: {type: 'none'}},
    padding: {value: {top: 7, bottom: 7, left: 7, right: 7}},
    width: {value: 400},
    height: {value: 300}
  });

  // spec constants should be used
  testSignals(t, vega.parse({
    background: 'red',
    autosize: 'fit',
    padding: 5,
    width: 200,
    height: 100
  }), {
    background: {value: 'red'},
    autosize: {value: {type: 'fit'}},
    padding: {value: {top: 5, bottom: 5, left: 5, right: 5}},
    width: {value: 200},
    height: {value: 100}
  });

  // spec constants should override config constants
  testSignals(t, vega.parse({
    config: {
      background: 'blue',
      autosize: 'none',
      padding: 7,
      width: 400,
      height: 300
    },
    background: 'red',
    autosize: 'fit',
    padding: 5,
    width: 200,
    height: 100
  }), {
    background: {value: 'red'},
    autosize: {value: {type: 'fit'}},
    padding: {value: {top: 5, bottom: 5, left: 5, right: 5}},
    width: {value: 200},
    height: {value: 100}
  });

  // spec constants and signals should merge
  testSignals(t, vega.parse({
    background: 'red',
    autosize: 'fit',
    padding: 5,
    width: 200,
    height: 100,
    signals: [
      {name: 'background', value: 'blue'},
      {name: 'autosize', value: {type: 'none'}},
      {name: 'padding', value: {top: 0, bottom: 0, left: 0, right: 0}},
      {name: 'width', value: 400},
      {name: 'height', value: 300}
    ]
  }), {
    background: {value: 'blue'},
    autosize: {value: {type: 'none'}},
    padding: {value: {top: 0, bottom: 0, left: 0, right: 0}},
    width: {value: 400},
    height: {value: 300}
  });

  // spec properties and signals should merge
  testSignals(t, vega.parse({
    background: {signal: "'red'"},
    autosize: {signal: "{type:'fit'}"},
    padding: {signal: '5'},
    width: {signal: '200'},
    height: {signal: '100'},
    signals: [
      {name: 'background', value: 'blue'},
      {name: 'autosize', value: {type: 'none'}},
      {name: 'padding', value: {top: 2, bottom: 2, left: 2, right: 2}},
      {name: 'width', value: 400},
      {name: 'height', value: 300}
    ]
  }), {
    background: {value: 'blue', update: {code: '\'red\''}},
    autosize: {value: {type: 'none'}, update: {code: '{type:\'fit\'}'}},
    padding: {value: {top: 2, bottom: 2, left: 2, right: 2}, update: {code: '5'}},
    width: {value: 400, update: {code: '200'}},
    height: {value: 300, update: {code: '100'}}
  });

  // config properties and signals should merge
  testSignals(t, vega.parse({
    config: {
      background: {signal: "'red'"},
      autosize: {signal: "{type:'fit'}"},
      padding: {signal: '5'},
      width: {signal: '200'},
      height: {signal: '100'}
    },
    signals: [
      {name: 'background', value: 'blue'},
      {name: 'autosize', value: {type: 'none'}},
      {name: 'padding', value: {top: 2, bottom: 2, left: 2, right: 2}},
      {name: 'width', value: 400},
      {name: 'height', value: 300}
    ]
  }), {
    background: {value: 'blue', update: {code: '\'red\''}},
    autosize: {value: {type: 'none'}, update: {code: '{type:\'fit\'}'}},
    padding: {value: {top: 2, bottom: 2, left: 2, right: 2}, update: {code: '5'}},
    width: {value: 400, update: {code: '200'}},
    height: {value: 300, update: {code: '100'}}
  });

  // spec properties should be overriden by signals
  testSignals(t, vega.parse({
    background: {signal: "'red'"},
    autosize: {signal: "{type:'fit'}"},
    padding: {signal: '5'},
    width: {signal: '200'},
    height: {signal: '100'},
    signals: [
      {name: 'background', update: '\'blue\''},
      {name: 'autosize', update: '{type:\'none\'}'},
      {name: 'padding', update: '{top: 2, bottom: 2, left: 2, right: 2}'},
      {name: 'width', update: '400'},
      {name: 'height', update: '300'}
    ]
  }), {
    background: {update: {code: '\'blue\''}},
    autosize: {update: {code: '{type:\'none\'}'}},
    padding: {update: {code: '{top:2,bottom:2,left:2,right:2}'}},
    width: {update: {code: '400'}},
    height: {update: {code: '300'}}
  });

  // config properties should be overriden by signals
  testSignals(t, vega.parse({
    config: {
      background: {signal: "'red'"},
      autosize: {signal: "{type:'fit'}"},
      padding: {signal: '5'},
      width: {signal: '200'},
      height: {signal: '100'}
    },
    signals: [
      {name: 'background', update: '\'blue\''},
      {name: 'autosize', update: '{type:\'none\'}'},
      {name: 'padding', update: '{top: 2, bottom: 2, left: 2, right: 2}'},
      {name: 'width', update: '400'},
      {name: 'height', update: '300'}
    ]
  }), {
    background: {update: {code: '\'blue\''}},
    autosize: {update: {code: '{type:\'none\'}'}},
    padding: {update: {code: '{top:2,bottom:2,left:2,right:2}'}},
    width: {update: {code: '400'}},
    height: {update: {code: '300'}}
  });

  t.end();
});
