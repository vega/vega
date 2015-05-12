var Node = require('../src/dataflow/Node');
global.expect = require('chai').expect;
global.parseSpec = require('../src/parse/spec');
global.util = require('datalib');
global.modelFactory = function(model) { return (model.fire(), model); };
global.viewFactory = function(model) { 
  model.scene(new Node(model)).fire();
  return model; 
};