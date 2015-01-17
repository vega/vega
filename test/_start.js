global.expect = require('chai').expect;
global.parseSpec = require('../src/parse/spec');
global.util = require('../src/util/index');
global.viewFactory = function(model) { return model; }