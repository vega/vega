'use strict';
var fs = require('fs');
var assert = require('chai').assert;
var Renderer = require('../../src/render/svg-string').Renderer;
var Builder = require('../../src/render/svg-string').Builder;
var res = './test/resources/';

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function json(file) {
  return JSON.parse(load(file));
}

describe('svg-string', function() {

  describe('render', function() {
    it('should render scenegraph to SVG string', function() {
      var scene = json('scenegraph-rect.json');
      var test = load('scenegraph-rect.svg');
      var svg = new Renderer()
        .initialize(null, 400, 200)
        .render(scene)
        .svg();
      assert.strictEqual(svg, test);
    });
    it('should build SVG defs as needed', function() {
      var str = new Renderer()
        .initialize(null, 100, 100)
        .render(json('scenegraph-defs.json'))
        .svg();
      var test = load('scenegraph-defs.svg');
      assert.strictEqual(str, test);
    });
  });
  
  describe('builder', function() {
    var marks = json('marks.json');
    var sb = new Builder();

    it('should return null for invalid mark type', function() {
      assert.isNull(sb.mark({marktype: 'foo-bar'}));
    });
    it('should build empty path for item-less area mark', function() {
      var str = sb.reset().mark({marktype: 'area', items:[]});
      var test = load('marks-empty-area.svg');
      assert.strictEqual(str, test);
    });
    it('should build empty path for item-less line mark', function() {
      var str = sb.reset().mark({marktype: 'line', items:[]});
      var test = load('marks-empty-line.svg');
      assert.strictEqual(str, test);
    });
    it('should build arc mark string', function() {
      var str = sb.reset().mark(marks.arc);
      var test = load('marks-arc.svg');
      assert.strictEqual(str, test);
    });
    it('should build horizontal area mark string', function() {
      var str = sb.reset().mark(marks['area-h']);
      var test = load('marks-area-h.svg');
      assert.equal(str, test);
    });
    it('should build vertical area mark string', function() {
      var str = sb.reset().mark(marks['area-v']);
      var test = load('marks-area-v.svg');
      assert.equal(str, test);
    });
    it('should build group mark string', function() {
      var str = sb.reset().mark(marks.group);
      var test = load('marks-group.svg');
      assert.strictEqual(str, test);
    });
    it('should build image mark string', function() {
      var str = sb.reset().mark(marks.image);
      var test = load('marks-image.svg');
      assert.strictEqual(str, test);
    });
    it('should build line mark string', function() {
      var str = sb.reset().mark(marks['line-1']);
      var test = load('marks-line-1.svg');
      assert.strictEqual(str, test);
      str = sb.reset().mark(marks['line-2']);
      test = load('marks-line-2.svg');
      assert.strictEqual(str, test);
    });
    it('should build path mark string', function() {
      var str = sb.reset().mark(marks.path);
      var test = load('marks-path.svg');
      assert.strictEqual(str, test);
    });
    it('should build rect mark string', function() {
      var str = sb.reset().mark(marks.rect);
      var test = load('marks-rect.svg');
      assert.strictEqual(str, test);
    });
    it('should build rule mark string', function() {
      var str = sb.reset().mark(marks.rule);
      var test = load('marks-rule.svg');
      assert.strictEqual(str, test);
    });
    it('should build symbol mark string', function() {
      var str = sb.reset().mark(marks.symbol);
      var test = load('marks-symbol.svg');
      assert.strictEqual(str, test);
    });
    it('should build text mark string', function() {
      var str = sb.reset().mark(marks.text);
      var test = load('marks-text.svg');
      assert.strictEqual(str, test);
    });
  });

});