var fs  = require('fs'),
    expect = require('chai').expect,
    Q = require('q'),
    vg1 = require('vega'),
    vg2 = require('../vega2'),
    amdLoader = require('amd-loader'),
    changeset = require('../src/dataflow/changeset'),
    bar1 = JSON.parse(fs.readFileSync('data/bar.vg1.json').toString()),
    bar2 = JSON.parse(fs.readFileSync('data/bar.vg2.json').toString()),
    cars = JSON.parse(fs.readFileSync('data/cars.json').toString()),
    pcp1 = JSON.parse(fs.readFileSync('data/parallel_coords.vg1.json').toString()),
    pcp2 = JSON.parse(fs.readFileSync('data/parallel_coords.vg2.json').toString());

pcp1.data[0].values = cars;
pcp2.data[0].values = cars;
delete pcp1.data[0].url;
delete pcp2.data[0].url;

var specs = {
  vg1: { bar: bar1, pcp: pcp1 },
  vg2: { bar: bar2, pcp: pcp2 }
};

function generate(specName, N) {
  var d1 = specs.vg1[specName].data[0], d2 = specs.vg2[specName].data[0];
  while(d1.values.length < N) {
    d1.values = d1.values.concat(d1.values);
    d2.values = d2.values.concat(d2.values)
  }

  if(d1.values.length > N) {
    d1.values = d1.values.slice(0, N);
    d2.values = d2.values.slice(0, N);
  }

  expect(specs.vg1[specName].data[0].values).to.have.length(N);
  expect(specs.vg2[specName].data[0].values).to.have.length(N);
  return true;
}

function checkScene(spec, scene) {
  expect(scene.items).to.have.length(1);
  expect(scene.items[0].items).to.have.length.of.at.least(1);
  expect(scene.items[0].items[0].items).to.have.length(spec.data[0].values.length);

  if(spec === bar1 || spec === bar2) {
    expect(scene.items[0].items[0].items[0].x).to.be.at.least(0);
    expect(scene.items[0].items[0].items[0].y).to.be.at.least(0);
    expect(scene.items[0].items[0].items[0].fill).to.equal("steelblue");
  } else if(spec === pcp1 || spec === pcp2) {
    expect(scene.items[0].items[0].items[0].items).to.have.length.of.at.least(1);
    expect(scene.items[0].items[0].items[0].items[0].items[0].x).to.be.at.least(0);
    expect(scene.items[0].items[0].items[0].items[0].items[0].y).to.be.at.least(0);
    expect(scene.items[0].items[0].items[0].items[0].items[0].stroke).to.equal("steelblue");
  }

  return true;
}

function run(specName, N, conditions) {
  return conditions.reduce(Q.when, Q.fcall(function() {
    console.log('\n==', specName.toUpperCase(), '(N = '+N+') ==');
    generate(specName, N);
    return 10;
  }));
}

function _vg1(spec) {
  var deferred = Q.defer(),
      start = Date.now();

  vg1.parse.spec(spec, function(chart) {
    var view = chart();
    view.render = function() {};
    view.update();
    console.log('vg1', Date.now() - start);

    expect(checkScene(spec, view._model.scene())).to.be.true;
    deferred.resolve();
  }, vg1.headless.View.Factory);
  
  return deferred.promise;
}

function _vg2(spec, name, viewFactory, restore) {
  var deferred = Q.defer(),
      start = Date.now(), next;

  name = name || 'vg2';
  viewFactory = viewFactory || function(model) { return model };

  vg2.parse.spec(spec, function(model) {
    console.log(name, 'inline data ingested', Date.now() - start);

    next = Date.now();
    model.fire();
    console.log(name, 'datasources fired', Date.now() - next);

    model.scene(new vg2.dataflow.Node(model.graph));
    next = Date.now();
    model.graph.propagate(changeset.create(null, true), model._builder);
    console.log(name, 'scene built', Date.now() - next);    

    console.log(name, 'total', Date.now() - start);    

    expect(checkScene(spec, model.scene())).to.be.true;
    if(restore) restore(model);
    deferred.resolve();
  }, viewFactory);

  return deferred.promise;
}

module.exports = {
  specs: specs,
  generate: generate,
  checkScene: checkScene,
  run: run,
  tasks: { vg1: _vg1, vg2: _vg2 }
};