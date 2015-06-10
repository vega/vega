'use strict';

var assert = require('chai').assert;
var Canvas = require('canvas');
var Bounds = require('../src/util/Bounds');
var parse = require('../src/path/parse');
var bound = require('../src/path/bounds');
var render = require('../src/path/render');

describe('path', function() {

  var paths = [
    'M 10,10 m 10,20',
    'M 10,10 l 10,20',
    'M 10,10 L 10,20',
    'M 10,10 L 10,20 L 20,20 Z',
    'M 10,10 L 10,20 L 20,20 z',
    'M 10,10 h 20',
    'M 10,10 H 20',
    'M 10,10 v 20',
    'M 10,10 V 20',
    'M 10,10 c 10,0,10,10,0,10',
    'M 10,10 C 10,0,10,10,0,10',
    'M 10,10 c 10,0,10,10,0,10 s 10,20,20,0',
    'M 10,10 C 10,0,10,10,0,10 S 10,20,20,0',
    'M 10,10 q 10,10,0,10',
    'M 10,10 Q 10,10,0,10',
    'M 10,10 t 20,0',
    'M 10,10 q 10,10,0,10 t 20,0',
    'M 10,10 Q 10,10,0,10 t 20,0',
    'M 10,10 t 0,10 t 20,0',
    'M 10,10 Q 10,10,0,10 T 20,0',
    'M  80,80 A 45,45,0,0,0,125,125 L 125,80 Z',
    'M 230,80 A 45,45,0,1,0,275,125 L 275,80 Z',
    'M  80,230 A 45,45,0,0,1,125,275 L 125,230 Z',
    'M 230,230 A 45,45,0,1,1,275,275 L 275,230 Z',
    'M 230,230 A 45,45,0,1,1,275,275 L 275,230 Z',
    'M 0,0 A 0.45,0.45,0,1,1,20,20 Z',
    'M 0,0 A 0.45,0.45,0,0,0,20,20 Z'
  ];
  
  var bounds = [
    { x1: 10, y1: 10, x2: 20, y2: 30 },
    { x1: 10, y1: 10, x2: 20, y2: 30 },
    { x1: 10, y1: 10, x2: 10, y2: 20 },
    { x1: 10, y1: 10, x2: 20, y2: 20 },
    { x1: 10, y1: 10, x2: 20, y2: 20 },
    { x1: 10, y1: 10, x2: 30, y2: 10 },
    { x1: 10, y1: 10, x2: 20, y2: 10 },
    { x1: 10, y1: 10, x2: 10, y2: 30 },
    { x1: 10, y1: 10, x2: 10, y2: 20 },
    { x1: 10, y1: 10, x2: 20, y2: 20 },
    { x1: 0, y1: 0, x2: 10, y2: 10 },
    { x1: 0, y1: 10, x2: 30, y2: 40 },
    { x1: -10, y1: 0, x2: 20, y2: 20 },
    { x1: 10, y1: 10, x2: 20, y2: 20 },
    { x1: 0, y1: 10, x2: 10, y2: 10 },
    { x1: 10, y1: 10, x2: 50, y2: 10 },
    { x1: 10, y1: 10, x2: 50, y2: 20 },
    { x1: 0, y1: 10, x2: 40, y2: 10 },
    { x1: 10, y1: 10, x2: 50, y2: 30 },
    { x1: -10, y1: 0, x2: 20, y2: 10 },
    { x1: 80, y1: 80, x2: 125, y2: 125 },
    { x1: 185.00000000000003, y1: 80, x2: 275, y2: 170 },
    { x1: 80, y1: 230, x2: 125, y2: 275 },
    { x1: 230, y1: 185.00000000000003, x2: 320, y2: 275 },
    { x1: 230, y1: 185.00000000000003, x2: 320, y2: 275 },
    { x1: 0, y1: -5.522847498307931, x2: 25.522847498307936, y2: 20 },
    { x1: -5.522847498307933,
      y1: 0,
      x2: 19.999999999999996,
      y2: 25.522847498307936 }
  ];

  describe('parse', function() {
    it('should parse svg path', function() {
      var s1 = "M1,1L1,2";
      var s2 = "M 1 1 L 1 2";
      var s3 = "M 1,1 L 1 2";
      var p = [['M',1,1], ['L',1,2]];
      assert.deepEqual(parse(s1), p);
      assert.deepEqual(parse(s2), p);
      assert.deepEqual(parse(s3), p);
    });
    it('should handle repeated arguments', function() {
      var s = "M 1 1 L 1 2 3 4";
      var p = [['M',1,1], ['L',1,2], ['L',3,4]];
      assert.deepEqual(parse(s), p);
    });
    it('should skip NaN parameters', function() {
      var s = "M 1 1 L 1 x";
      var p = [['M',1,1], ['L',1]];
      assert.deepEqual(parse(s), p);
    });
  });

  describe('bounds', function() {
    it('should calculate paths bounds', function() {
      for (var i=0; i<paths.length; ++i) {
        var p = parse(paths[i]);
        var b = bound(p, new Bounds());
        assert.equal(b.x1, bounds[i].x1);
        assert.equal(b.x2, bounds[i].x2);
        assert.equal(b.y1, bounds[i].y1);
        assert.equal(b.y2, bounds[i].y2);
      }
    });
  });

  describe('render', function() {
    it('should render paths', function() {
      var c1 = new Canvas(500, 500),
          c2 = new Canvas(500, 500),
          g1 = c1.getContext('2d'),
          g2 = c2.getContext('2d'),
          dx = 10, dy = 50, p;

      g1.translate(dx, dy);
      g1.globalAlpha = g2.globalAlpha = 0.5;
      g1.strokeStyle = g2.strokeStyle ='steelblue';
      g1.lineWidth = g2.lineWidth = 2;

      for (var i=0; i<paths.length; ++i) {
        p = parse(paths[i]);
        render(g1, p,  0,  0); g1.stroke();
        render(g2, p, dx, dy); g2.stroke();
      }

      var test = require('fs')
        .readFileSync('test/resources/png/paths.png', 'utf8');
      assert.equal(c1.toBuffer(), test);
      assert.equal(c2.toBuffer(), test);
    });
  });

});