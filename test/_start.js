var Node  = require('vega-dataflow').Node,
    log   = require('vega-logging'),
    chai  = require('chai'),
    spies = require('chai-spies'),
    tv4   = require('tv4');

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