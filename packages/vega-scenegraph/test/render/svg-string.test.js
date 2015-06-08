'use strict';
var fs = require('fs');
var assert = require('chai').assert;
var Renderer = require('../../src/render/svg-string').Renderer;
var Builder = require('../../src/render/svg-string').Builder;
var res = './test/resources/';

var GENERATE_TEST_FILES = true;
function generate(path, str) {
  if (!GENERATE_TEST_FILES) return;
  fs.writeFileSync(res + path, str);
}

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}
function json(file) {
  return JSON.parse(load(file));
}

function render(scene, w, h) {
  return new Renderer()
    .initialize(null, w, h)
    .render(scene)
    .svg();
}

describe('svg-string', function() {

  describe('render', function() {
    it('should render scenegraph to SVG string', function() {
      var scene = json('scenegraph-rect.json');
      var str = render(scene, 400, 200);
      generate('svg/scenegraph-rect.svg', str);
      var test = load('svg/scenegraph-rect.svg');
      assert.strictEqual(str, test);
    });
    it('should support clipping and gradients', function() {
      var scene = json('scenegraph-defs.json');
      var str = render(scene, 100, 100);
      generate('svg/scenegraph-defs.svg', str);
      var test = load('svg/scenegraph-defs.svg');
      assert.strictEqual(str, test);
    });
    it('should support axes, legends and sub-groups', function() {
      var scene = json('scenegraph-barley.json');
      var str = render(scene, 360, 740);
      generate('svg/scenegraph-barley.svg', str);
      var test = load('svg/scenegraph-barley.svg');
      assert.equal(str, test);
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
      generate('svg/marks-empty-area.svg', str);
      var test = load('svg/marks-empty-area.svg');
      assert.strictEqual(str, test);
    });
    it('should build empty path for item-less line mark', function() {
      var str = sb.reset().mark({marktype: 'line', items:[]});
      generate('svg/marks-empty-line.svg', str);
      var test = load('svg/marks-empty-line.svg');
      assert.strictEqual(str, test);
    });
    it('should build arc mark string', function() {
      var str = sb.reset().mark(marks.arc);
      generate('svg/marks-arc.svg', str);
      var test = load('svg/marks-arc.svg');
      assert.strictEqual(str, test);
    });
    it('should build horizontal area mark string', function() {
      var str = sb.reset().mark(marks['area-h']);
      generate('svg/marks-area-h.svg', str);
      var test = load('svg/marks-area-h.svg');
      assert.equal(str, test);
    });
    it('should build vertical area mark string', function() {
      var str = sb.reset().mark(marks['area-v']);
      generate('svg/marks-area-v.svg', str);
      var test = load('svg/marks-area-v.svg');
      assert.equal(str, test);
    });
    it('should build group mark string', function() {
      var str = sb.reset().mark(marks.group);
      generate('svg/marks-group.svg', str);
      var test = load('svg/marks-group.svg');
      assert.strictEqual(str, test);
    });
    it('should build image mark string', function() {
      var str = sb.reset().mark(marks.image);
      generate('svg/marks-image.svg', str);
      var test = load('svg/marks-image.svg');
      assert.strictEqual(str, test);
    });
    it('should build line mark string', function() {
      var str = sb.reset().mark(marks['line-1']);
      generate('svg/marks-line-1.svg', str);
      var test = load('svg/marks-line-1.svg');
      assert.strictEqual(str, test);

      str = sb.reset().mark(marks['line-2']);
      generate('svg/marks-line-2.svg', str);
      test = load('svg/marks-line-2.svg');
      assert.strictEqual(str, test);
    });
    it('should build path mark string', function() {
      var str = sb.reset().mark(marks.path);
      generate('svg/marks-path.svg', str);
      var test = load('svg/marks-path.svg');
      assert.strictEqual(str, test);
    });
    it('should build rect mark string', function() {
      var str = sb.reset().mark(marks.rect);
      generate('svg/marks-rect.svg', str);
      var test = load('svg/marks-rect.svg');
      assert.strictEqual(str, test);
    });
    it('should build rule mark string', function() {
      var str = sb.reset().mark(marks.rule);
      generate('svg/marks-rule.svg', str);
      var test = load('svg/marks-rule.svg');
      assert.strictEqual(str, test);
    });
    it('should build symbol mark string', function() {
      var str = sb.reset().mark(marks.symbol);
      generate('svg/marks-symbol.svg', str);
      var test = load('svg/marks-symbol.svg');
      assert.strictEqual(str, test);
    });
    it('should build text mark string', function() {
      var str = sb.reset().mark(marks.text);
      generate('svg/marks-text.svg', str);
      var test = load('svg/marks-text.svg');
      assert.strictEqual(str, test);
    });
  });

});