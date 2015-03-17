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
    sct2 = JSON.parse(fs.readFileSync('data/scatter.vg2.json').toString()),
    trl1 = JSON.parse(fs.readFileSync('data/trellis.vg1.json').toString()),
    trl2 = JSON.parse(fs.readFileSync('data/trellis.vg2.json').toString()),
    barley = JSON.parse(fs.readFileSync('data/barley.json').toString()),
    splom1 = JSON.parse(fs.readFileSync('data/splom.vg1.json').toString()),
    splom2 = JSON.parse(fs.readFileSync('data/splom.vg2.json').toString()),
    iris = JSON.parse(fs.readFileSync('data/iris.json').toString());

pcp1.data[0].values = pcp2.data[0].values = cars;
trl1.data[0].values = trl2.data[0].values = barley;
splom1.data[1].values = splom2.data[1].values = iris;

var specs = {
  vg1: { bar: bar1, pcp: pcp1, sct: sct1, splom: splom1, trellis: trl1 },
  vg2: { bar: bar2, pcp: pcp2, sct: sct2, splom: splom2, trellis: trl2 },
  d3: { sct: require('./data/scatter.d3') }
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
    if(specName == 'splom') N = Math.floor(Math.sqrt(N)); // Because we're crossing.

    while(d1.values.length < N) {
      d1.values = d2.values = d1.values.concat(d1.values);
    }

    if(d1.values.length > N) {
      d1.values = d2.values = d1.values.slice(0, N);
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

  if([splom1, splom2, trl1, trl2].indexOf(spec) < 0) {
    expect(scene.items[0].items[0].items).to.have.length(spec.data[0].values.length);
  }

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

function _d3(spec, N, C, name) {
  var data = random(N, C),
      start = Date.now(),
      messages;

  try {
    messages = JSON.parse(fs.readFileSync('results.raw/'+name+'.json').toString());
  } catch(e) {
    messages = [];
  }

  spec(data);
  messages.push({type: 'd3', time: Date.now() - start});
  console.log(messages[messages.length-1]);

  fs.writeFileSync('results.raw/'+name+'.json', JSON.stringify(messages, null, 2));
}

function _vg1(spec, name, viewFactory, restore) {
  var deferred = Q.defer(),
      start, messages;

  viewFactory = viewFactory || vg1.headless.View.Factory;

  try {
    messages = JSON.parse(fs.readFileSync('results.raw/'+name+'.json').toString());
  } catch(e) {
    messages = [];
  }   

  start = Date.now();

  vg1.parse.spec(spec, function(chart) {
    var view = chart();
    view.render = function() {};
    view.update();
    messages.push({type: 'vg1', time: Date.now() - start});
    console.log(messages[messages.length-1]);

    expect(checkScene(spec, view._model.scene())).to.be.true;
    if(restore) restore(view, name, start, messages);

    fs.writeFileSync('results.raw/'+name+'.json', JSON.stringify(messages, null, 2));

    deferred.resolve();
  }, viewFactory);
  
  return deferred.promise;
}

function _vg2(spec, name, viewFactory, restore) {
  var deferred = Q.defer(),
      start, next, messages;

  name = name || 'vg2';
  viewFactory = viewFactory || function(model) { return model };

  try {
    messages = JSON.parse(fs.readFileSync('results.raw/'+name+'.json').toString());
  } catch(e) {
    messages = [];
  }

  start = Date.now();

  // vg2.config.debug = vg2.config.trackTime = true
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

    fs.writeFileSync('results.raw/'+name+'.json', JSON.stringify(messages, null, 2));

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
  tasks: { d3: _d3, vg1: _vg1, vg2: _vg2 }
};