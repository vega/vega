'use strict';

var fs = require('fs');
var assert = require('chai').assert;
var Renderer = require('../src/render/svg/SVGRenderer');
var Handler = require('../src/render/svg/SVGHandler');
var initScene = require('../src/util/scene').fromJSON;
var res = './test/resources/';

var jsdom = require('jsdom').jsdom();

var events = [
  'keydown',
  'keypress',
  'keyup',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseout',
  'mouseover',
  'dragover',
  'dragenter',
  'dragleave',
  'click',
  'dblclick',
  'wheel',
  'mousewheel',
  'touchstart',
  'touchmove',
  'touchend'
];

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function loadScene(file) {
  return initScene(load(file));
}

function render(scene, w, h) {
  global.document = jsdom;
  var r = new Renderer()
    .initialize(jsdom.body, w, h)
    .render(scene);
  delete global.document;
  return r.element();
}

function event(name, x, y) {
  var evt = jsdom.createEvent('MouseEvents');
  evt.initEvent(name, false, true);
  evt.clientX = x || 0;
  evt.clientY = y || 0;
  return evt;
}

describe('svg handler', function() {
  var marks = JSON.parse(load('marks.json'));
  for (var name in marks) { initScene(marks[name]); }

  it('should handle input events', function() {
    var scene = loadScene('scenegraph-rect.json');
    var handler = new Handler()
      .initialize(render(scene, 400, 200))
      .scene(scene);
    assert(handler.scene(), scene);

    var svg = handler.svg();
    var count = 0;
    var increment = function() { count++; };

    events.forEach(function(name) {
      handler.on(name, increment);
    });
    assert.equal(handler.handlers().length, events.length);

    events.forEach(function(name) {
      svg.dispatchEvent(event(name));
    });

    svg.dispatchEvent(event('mousemove', 0, 0));
    svg.dispatchEvent(event('mousemove', 50, 150));
    svg.dispatchEvent(event('mousedown', 50, 150));
    svg.dispatchEvent(event('mouseup', 50, 150));
    svg.dispatchEvent(event('click', 50, 150));
    svg.dispatchEvent(event('mousemove', 50, 151));
    svg.dispatchEvent(event('mousemove', 50, 1));
    svg.dispatchEvent(event('mouseout', 1, 1));
    svg.dispatchEvent(event('dragover', 50, 151));
    svg.dispatchEvent(event('dragover', 50, 1));
    svg.dispatchEvent(event('dragleave', 1, 1));

    // 11 events above + no sub-events from JSDOM
    assert.equal(count, events.length + 11);

    handler.off('mousemove', {});
    assert.equal(handler.handlers().length, events.length);

    handler.off('nonevent');
    assert.equal(handler.handlers().length, events.length);

    events.forEach(function(name) {
      handler.off(name, increment);
    });

    assert.equal(handler.handlers().length, 0);
  });

});