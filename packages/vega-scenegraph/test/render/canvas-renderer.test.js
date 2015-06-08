'use strict';
var fs = require('fs');
var assert = require('chai').assert;
var Renderer = require('../../src/render/canvas/CanvasRenderer');
var initialize = require('../../src/util/init-scene');
var res = './test/resources/';

var GENERATE_TEST_FILES = true;
function generate(path, image) {
  if (!GENERATE_TEST_FILES) return;
  fs.writeFileSync(res + path, image);
}

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}
function json(file) {
  return JSON.parse(load(file));
}
function loadScene(file) {
  return initialize(JSON.parse(load(file)));
}

function render(scene, w, h) {
  return new Renderer()
    .initialize(null, w, h)
    .render(scene)
    .canvas()
    .toBuffer();
}

function renderAsync(scene, w, h, callback) {
  var r = new Renderer()
    .initialize(null, w, h)
    .render(scene);
  
  function wait() {
    if (r.pendingImages() === 0) {
      callback(r.canvas().toBuffer());      
    } else {
      setTimeout(wait, 100);
    }
  }

  wait();
}

function clearPathCache(mark) {
  mark.items.forEach(function(item) {
    item.pathCache = null;
  });
  return mark;
}

describe('canvas', function() {
  var marks = json('marks.json');
  for (var name in marks) { initialize(marks[name]); }

  describe('render', function() {

    it('should support argument free constructor', function() {
      var r = new Renderer();
      assert.equal(r.canvas(), null);
      assert.equal(r.context(), null);
    });

    it('should render scenegraph to canvas', function() {
      var scene = loadScene('scenegraph-rect.json');
      var image = render(scene, 400, 200);
      generate('png/scenegraph-rect.png', image);
      var test = load('png/scenegraph-rect.png');
      assert.equal(image, test);
    });

    it('should support clipping and gradients', function() {
      var scene = loadScene('scenegraph-defs.json');
      var image = render(scene, 102, 102);
      generate('png/scenegraph-defs.png', image);
      var test = load('png/scenegraph-defs.png');
      assert.equal(image, test);
    });

    it('should support axes, legends and sub-groups', function() {
      var scene = loadScene('scenegraph-barley.json');
      var image = render(scene, 360, 740);
      generate('png/scenegraph-barley.png', image);
      var test = load('png/scenegraph-barley.png');
      assert.equal(image, test);
    });

    it('should support item-based redraw', function() {
      var scene = loadScene('scenegraph-rect.json');
      var r = new Renderer()
        .initialize(null, 400, 200)
        .background('white')
        .render(scene);

      var rect = scene.items[0].items[0].items[1];
      rect.fill = 'red';
      rect.width *= 2;
      r.render(scene, [rect]);

      var image = r.canvas().toBuffer();
      generate('png/scenegraph-rect-redraw.png', image);
      var test = load('png/scenegraph-rect-redraw.png');
      assert.equal(image, test);
    });
  
  // it('should return null for invalid mark type', function() {
  //   assert.isNull(sb.mark({marktype: 'foo-bar'}));
  // });
  // it('should build empty path for item-less area mark', function() {
  //   var str = render({marktype: 'area', items:[]});
  //   var test = load('marks-empty-area.png');
  //   assert.equal(str, test);
  // });
  // it('should build empty path for item-less line mark', function() {
  //   var str = render({marktype: 'line', items:[]});
  //   var test = load('marks-empty-line.png');
  //   assert.equal(str, test);
  // });

    it('should skip empty item sets', function() {
      var scene = {marktype:'', items:[]};
      var types = [
        'arc',
        'area',
        'group',
        'image',
        'line',
        'path',
        'rect',
        'rule',
        'symbol',
        'text'
      ];
      var test = load('png/marks-empty.png'), image;
      
      for (var i=0; i<types.length; ++i) {
        scene.marktype = types[i];
        image = render(scene, 500, 500);
        assert.equal(image, test);
      }
    });

    it('should render arc mark', function() {
      var image = render(marks.arc, 500, 500);
      generate('png/marks-arc.png', image);
      var test = load('png/marks-arc.png');
      assert.equal(image, test);
    });
    it('should render horizontal area mark', function() {
      var image = render(marks['area-h'], 500, 500);
      generate('png/marks-area-h.png', image);
      var test = load('png/marks-area-h.png');
      assert.equal(image, test);

      // clear path cache and re-render
      image = render(clearPathCache(marks['area-h']), 500, 500);
      assert.equal(image, test);
    });
    it('should render vertical area mark', function() {
      var image = render(marks['area-v'], 500, 500);
      generate('png/marks-area-v.png', image);
      var test = load('png/marks-area-v.png');
      assert.equal(image, test);

      // clear path cache and re-render
      image = render(clearPathCache(marks['area-v']), 500, 500);
      assert.equal(image, test);
    });
    it('should render group mark', function() {
      var image = render(marks.group, 500, 500);
      generate('png/marks-group.png', image);
      var test = load('png/marks-group.png');
      assert.equal(image, test);
    });
    it('should render image mark', function(done) {
      renderAsync(marks.image, 500, 500, function(image) {
        generate('png/marks-image.png', image);
        var test = load('png/marks-image.png');
        assert.equal(image, test);
        done();        
      });
    });
    it('should skip invalid image', function() {
      var scene = initialize({
        marktype: 'image',
        items: [{url: 'does_not_exist.png'}]
      });
      var image = render(scene, 500, 500);
      generate('png/marks-empty.png', image);
      var test = load('png/marks-empty.png');
      assert.equal(image, test);
    });
    it('should render line mark', function() {
      var image = render(marks['line-1'], 500, 500);
      generate('png/marks-line-1.png', image);
      var test = load('png/marks-line-1.png');
      assert.equal(image, test);

      image = render(marks['line-2'], 500, 500);
      generate('png/marks-line-2.png', image);
      test = load('png/marks-line-2.png');
      assert.equal(image, test);

      // clear path cache and re-render
      image = render(clearPathCache(marks['line-2']), 500, 500);
      assert.equal(image, test);
    });
    it('should render path mark', function() {
      var image = render(marks.path, 500, 500);
      generate('png/marks-path.png', image);
      var test = load('png/marks-path.png');
      assert.equal(image, test);

      // clear path cache and re-render
      image = render(clearPathCache(marks.path), 500, 500);
      assert.equal(image, test);
    });
    it('should render rect mark', function() {
      var image = render(marks.rect, 500, 500);
      generate('png/marks-rect.png', image);
      var test = load('png/marks-rect.png');
      assert.equal(image, test);
    });
    it('should render rule mark', function() {
      var image = render(marks.rule, 500, 500);
      generate('png/marks-rule.png', image);
      var test = load('png/marks-rule.png');
      assert.equal(image, test);
    });
    it('should render symbol mark', function() {
      var image = render(marks.symbol, 500, 500);
      generate('png/marks-symbol.png', image);
      var test = load('png/marks-symbol.png');
      assert.equal(image, test);
    });
    it('should render text mark', function() {
      var image = render(marks.text, 500, 500);
      generate('png/marks-text.png', image);
      var test = load('png/marks-text.png');
      assert.equal(image, test);
    });
  });
});