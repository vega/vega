var Node  = require('../src/dataflow/Node'),
    chai  = require('chai'),
    spies = require('chai-spies');

global.d3 = require('d3');
global.dl = require('datalib');
global.chai = chai.use(spies);
global.expect = chai.expect;
global.validator  = require('is-my-json-valid');
global.transforms = require('../src/transforms/');
global.parseSpec = require('../src/parse/spec');
global.schema = require('../src/util/schema')();

global.schemaPath = function(path) {
  return dl.extend({ refs: schema.refs, defs: schema.defs }, path);
};

global.modelFactory = function(model) { return (model.fire(), model); };
global.viewFactory = function(model) { 
  model.scene(new Node(model)).fire();
  return model; 
};