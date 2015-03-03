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
    pcp2 = JSON.parse(fs.readFileSync('data/parallel_coords.vg2.json').toString()),
    sct1 = JSON.parse(fs.readFileSync('data/scatter.vg1.json').toString()),
    sct2 = JSON.parse(fs.readFileSync('data/scatter.vg2.json').toString());

pcp1.data[0].values = cars;
pcp2.data[0].values = cars;
delete pcp1.data[0].url;
delete pcp2.data[0].url;

var specs = {
  vg1: { bar: bar1, pcp: pcp1, sct: sct1 },
  vg2: { bar: bar2, pcp: pcp2, sct: sct2 }
};

function random(N, C) {
  var out = [];
  for (var i=0; i<N; ++i) {
    var o = {};
    o.idx = i;
    o.x = "c" + ~~(C*(i/N));
    o.y = C * Math.random();
    o.z = o.y + C * Math.random();
    out.push(o);
  }
  return out;
}

function generate(specName, N, C) {
  var d1 = specs.vg1[specName].data[0], d2 = specs.vg2[specName].data[0];

  if(d1.values) {
    while(d1.values.length < N) {
      d1.values = d1.values.concat(d1.values);
      d2.values = d2.values.concat(d2.values)
    }

    if(d1.values.length > N) {
      d1.values = d1.values.slice(0, N);
      d2.values = d2.values.slice(0, N);
    }
  } else {
    d1.values = d2.values = random(N, C);
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

function run(specName, N, C, conditions) {
  return conditions.reduce(Q.when, Q.fcall(function() {
    console.log('\n==', specName.toUpperCase(), '(N = '+N+') ==');
    generate(specName, N, C);
    return;
  }));
}

function _vg1(spec, name, viewFactory, restore) {
  var deferred = Q.defer(),
      start = Date.now(),
      messages;

  viewFactory = viewFactory || vg1.headless.View.Factory;

  try {
    messages = JSON.parse(fs.readFileSync('results/'+name+'.json').toString());
  } catch(e) {
    messages = [];
  }   

  vg1.parse.spec(spec, function(chart) {
    var view = chart();
    view.render = function() {};
    view.update();
    messages.push({type: 'vg1', time: Date.now() - start});
    console.log(messages[messages.length-1]);

    expect(checkScene(spec, view._model.scene())).to.be.true;
    if(restore) restore(model, name, start, messages);

    fs.writeFileSync('results/'+name+'.json', JSON.stringify(messages, null, 2));

    deferred.resolve();
  }, viewFactory);
  
  return deferred.promise;
}

function _vg2(spec, name, viewFactory, restore) {
  var deferred = Q.defer(),
      start = Date.now(), next,
      messages;

  name = name || 'vg2';
  viewFactory = viewFactory || function(model) { return model };

  try {
    messages = JSON.parse(fs.readFileSync('results/'+name+'.json').toString());
  } catch(e) {
    messages = [];
  }

  // vg2.config.debug = true
  vg2.parse.spec(spec, function(model) {
    messages.push({type: name + ' inline data ingested', time: Date.now() - start});
    console.log(messages[messages.length-1]);

    next = Date.now();
    model.fire();
    messages.push({type: name + ' datasources fired', time: Date.now() - next});
    console.log(messages[messages.length-1]);

    model.scene(new vg2.dataflow.Node(model.graph));
    next = Date.now();
    model.graph.propagate(changeset.create(null, true), model._builder);
    messages.push({type: name + ' scene built', time: Date.now() - next});    
    console.log(messages[messages.length-1]);

    messages.push({type: name + ' total', time: Date.now() - start});    
    console.log(messages[messages.length-1]);

    expect(checkScene(spec, model.scene())).to.be.true;
    if(restore) restore(model, name, start, messages);

    fs.writeFileSync('results/'+name+'.json', JSON.stringify(messages, null, 2));

    deferred.resolve();
  }, viewFactory);

  return deferred.promise;
}

module.exports = {
  specs: specs,
  random: random,
  generate: generate,
  checkScene: checkScene,
  run: run,
  tasks: { vg1: _vg1, vg2: _vg2 }
};