var expect = require('chai').expect,
    Q = require('q'),
    amdLoader = require('amd-loader'),
    vg1 = require('vega'),
    vg2 = require('../vega2'),
    changeset = require('../src/dataflow/changeset'),
    b = require('./index'),
    s1 = b.specs.vg1,
    s2  = b.specs.vg2;

// vg2.config.debug = true;

function _vg1(spec) {
  var start = Date.now(),
      deferred = Q.defer();

  vg1.parse.spec(spec, function(chart) {
    var view = chart();
    view.render = function() {};
    view.update();

    var scene = view._model.scene();
    expect(b.checkScene(spec, scene)).to.be.true;
    console.log('vg1', Date.now() - start);
    deferred.resolve();
  }, vg1.headless.View.Factory);
  
  return deferred.promise;
}

function _vg2(spec) {
  var start = Date.now(), next,
      deferred = Q.defer();

  vg2.parse.spec(spec, function(model) {
    console.log('vg2 inline data ingested', Date.now() - start);

    next = Date.now();
    model.fire();
    console.log('vg2 datasources fired', Date.now() - next);

    model.scene(new vg2.dataflow.Node(model.graph));
    next = Date.now();
    model.graph.propagate(changeset.create(null, true), model._builder);
    console.log('vg2 scene built', Date.now() - next);    

    console.log('vg2 total', Date.now() - start);    

    expect(b.checkScene(spec, model.scene())).to.be.true;

    deferred.resolve();
  }, function(model) {
    return model; 
  });

  return deferred.promise;
}


b.run('bar', 1000, [_vg1.bind(null, s1.bar), _vg2.bind(null, s2.bar)])
  .then(function() {
    return b.run('bar', 10000, [_vg1.bind(null, s1.bar), _vg2.bind(null, s2.bar)]);
  })
  .then(function() {
    return b.run('bar', 100000, [_vg1.bind(null, s1.bar), _vg2.bind(null, s2.bar)]);
  })
  .then(function() {
    return b.run('pcp', 1000, [_vg1.bind(null, s1.pcp), _vg2.bind(null, s2.pcp)]);
  })
  .then(function() {
    return b.run('pcp', 10000, [_vg1.bind(null, s1.pcp), _vg2.bind(null, s2.pcp)]);
  })
  .then(function() {
    return b.run('pcp', 100000, [_vg1.bind(null, s1.pcp), _vg2.bind(null, s2.pcp)]);
  })