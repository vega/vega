var Node  = require('vega-dataflow').Node,
    log   = require('vega-logging'),
    chai  = require('chai'),
    spies = require('chai-spies'),
    tv4   = require('tv4'),
    path  = require('path')
    fs = require('fs');

// configure logging
log.error = function() {}; // disable error output during tests

// set globals
global.d3 = require('d3');
global.dl = require('datalib');
global.chai = chai.use(spies);
global.expect = chai.expect;
global.transforms = require('../src/transforms/');
global.parseSpec = require('../src/parse/spec');
global.schema = require('../src/core/schema')();
global.tv4 = tv4;

// set baseURL for vega-datasets.
var config = require('../src/core/config');
config.load.baseURL = 'file://node_modules/vega-datasets/';

global.validator = function(schema) {
  return function(data) {
    return tv4.validate(data, schema);
  };
};

global.schemaPath = function(path) {
  return dl.extend({ refs: schema.refs, defs: schema.defs }, path);
};

global.modelFactory = function(model) {
  return (model.fire(), model);
};

global.viewFactory = function(model) {
  model.scene(new Node(model)).fire();
  return model;
};

global.examples = function() {
  var dirs  = ['examples/', 'test/spec/'],
      files = [];

  dirs.forEach(function(dir) {
    expect(fs.statSync(dir).isDirectory()).to.equal(true);
    var specs = fs.readdirSync(dir).filter(function(name) {
      var basename = path.basename(name, '.json');
      return path.extname(name) === '.json' &&
        basename.indexOf('-params') < 0;
    });

    files = files.concat(specs.map(function(name) { return dir+name; }));
  });

  return files;
};

global.getFiles = function(dirs) {
  var files = [];
  dirs.forEach(function(dir) {
    expect(fs.statSync(dir).isDirectory()).to.equal(true);
    var configs = fs.readdirSync(dir);
    files = files.concat(configs.map(function(name) { return dir + name; }));
  });
  return files;
}

global.themes = function() {
  return getFiles(['examples/themes/']);
};