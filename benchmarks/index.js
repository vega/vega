var fs  = require('fs'),
    expect = require('chai').expect,
    Q = require('q'),
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
  } else if(spec === pcp1 || spec === pcp2) {
    expect(scene.items[0].items[0].items[0].items).to.have.length.of.at.least(1);
    expect(scene.items[0].items[0].items[0].items[0].items[0].x).to.be.at.least(0);
    expect(scene.items[0].items[0].items[0].items[0].items[0].y).to.be.at.least(0);
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

module.exports = {
  specs: specs,
  generate: generate,
  checkScene: checkScene,
  run: run
};