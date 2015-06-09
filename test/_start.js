var Node  = require('../src/dataflow/Node'),
    chai  = require('chai'),
    spies = require('chai-spies');

global.d3 = require('d3');
global.chai = chai.use(spies);
global.expect = chai.expect;
global.validator  = require('is-my-json-valid')
global.parseSpec = require('../src/parse/spec');
global.util = require('datalib');
global.modelFactory = function(model) { return (model.fire(), model); };
global.viewFactory = function(model) { 
  model.scene(new Node(model)).fire();
  return model; 
};