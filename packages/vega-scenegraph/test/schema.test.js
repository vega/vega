'use strict';

var fs = require('fs');
var assert = require('chai').assert;
var Util = require('../src/util/scene');

var tv4 = require('tv4');
var schemaFile = './vega-scenegraph-schema.json';
var schema = JSON.parse(fs.readFileSync(schemaFile));
var res = './test/resources/';

function error_msg(desc, e) {
  return desc + ': ' + JSON.stringify(e, function(key, value) {
    return key === 'stack' ? undefined : value;
  }, 2);
}

describe('schema', function() {

  it('should validate correct marks', function() {
    var marks = JSON.parse(fs.readFileSync(res + 'marks.json'));
    for (var name in marks) {
      var v = tv4.validate(marks[name], schema);
      assert.ok(v, error_msg(name, tv4.error));
    }
  });

  it('should invalidate incorrect marks', function() {
    var marks = JSON.parse(fs.readFileSync(res + 'marks.json'));
    for (var name in marks) {
      var scene = marks[name];
      switch (scene.marktype) {
        case 'rect': scene.marktype = 'fake'; break;
        case 'text': scene.marktype = 'arc'; break;
        default: scene.marktype = 'text';
      }
      assert.notOk(tv4.validate(scene, schema));
    }
  });

  it('should validate scenegraph files', function() {
    var files = [
      'scenegraph-barley.json',
      'scenegraph-defs.json',
      'scenegraph-rect.json'
    ];
    files.forEach(function(f) {
      var scene = JSON.parse(fs.readFileSync(res + f));
      var v = tv4.validate(scene, schema);
      assert.ok(v, error_msg(f, tv4.error));
    });
  });

  it('should invalidate degenerate scenegraphs', function() {
    var list = [
      {},
      {x: 0, y:1},
      {items: [{x:0, y:0}]},
      {marktype:'blah', items: []},
      {marktype:'group', items: [{axisItems: [{marktype:'rect', items:[]}]}]},
      {marktype:'group', items: [{axisItems: [{
        marktype:'group',
        items: [{axisItems: []}]
      }]}]},
    ];
    
    list.forEach(function(scene) {
      assert.notOk(tv4.validate(scene, schema));
    });
  });

  it('should validate svg paths', function() {
    var bad = [
      {marktype: 'path', items: [{path: 'lorem ipsum'}]},
      {marktype: 'path', items: [{path: 'L1,2'}]},
      {marktype: 'path', items: [{path: 'L1\n2'}]},
      {marktype: 'path', items: [{path: 'M,1,2'}]},
      {marktype: 'path', items: [{path: 'M1,2,3'}]},
      {marktype: 'path', items: [{path: 'M1,2L1'}]},
      {marktype: 'path', items: [{path: 'M1,2L1,2,3'}]},
      {marktype: 'path', items: [{path: 'M1,2A1,2'}]},
      {marktype: 'path', items: [{path: 'M1,2A1,-2,1.3,0,0,3,4'}]},
      {marktype: 'path', items: [{path: 'M1,2A-1,2,1.3,0,0,3,4'}]}
    ];
    
    bad.forEach(function(scene) {
      assert.notOk(tv4.validate(scene, schema), scene.items[0].path);
    });
    
    var good = [
      {marktype: 'path', items: [{path: ''}]},
      {marktype: 'path', items: [{path: 'M1,2'}]},
      {marktype: 'path', items: [{path: 'M1-2'}]},
      {marktype: 'path', items: [{path: 'M1+2'}]},
      {marktype: 'path', items: [{path: '\t  M1,2  \f'}]},
      {marktype: 'path', items: [{path: 'M1,2Z'}]},
      {marktype: 'path', items: [{path: 'M1,2 L1,3 4,5'}]},
      {marktype: 'path', items: [{path: 'M 1 2 L 1 3 4 5'}]},
      {marktype: 'path', items: [{path: 'M1,2L3,4ZM5,6C7,8,9,10,11,12'}]},
      {marktype: 'path', items: [{path: 'M1,2A1,2,1.3,0,0,3,4'}]}
    ];
    
    good.forEach(function(scene) {
      assert.ok(tv4.validate(scene, schema), error_msg(scene, tv4.error));
    });
  });

  it('should validate colors', function() {
    var bad = [
      {marktype: 'rect', items: [{fill: '#ffff'}]},
      {marktype: 'rect', items: [{fill: 'rgb(256,0,0)'}]},
      {marktype: 'rect', items: [{fill: 'rgb(50%,50%,120%)'}]},
      {marktype: 'rect', items: [{fill: 'hsl(355,20,30%)'}]}
    ];
    
    bad.forEach(function(scene) {
      assert.notOk(tv4.validate(scene, schema));
    });
    
    var good = [
      {marktype: 'rect', items: [{fill: '#fff'}]},
      {marktype: 'rect', items: [{fill: '#abcdEf'}]},
      {marktype: 'rect', items: [{fill: 'steelblue'}]},
      {marktype: 'rect', items: [{fill: 'SteelBlue'}]},
      {marktype: 'rect', items: [{fill: 'rgb(255,0,0)'}]},
      {marktype: 'rect', items: [{fill: 'rgb(50%,50%,100%)'}]},
      {marktype: 'rect', items: [{fill: 'hsl(355,20%,30%)'}]}
    ];
    
    good.forEach(function(scene) {
      assert.ok(tv4.validate(scene, schema), error_msg(scene, tv4.error));
    });
  });

});