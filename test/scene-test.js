// Standardize font metrics to suppress cross-platform variance.
// UGH.
var cachedDoc = global.document;
global.document = {
  createElement: function() {
    return {
      getContext: function() { return this; },
      measureText: function(text) {
        text = text != null ? String(text) : '';
        return ~~(0.8 * text.length * 11);
      }
    };
  }
};

var tape = require('tape'),
    vega = require('../'),
    fs = require('fs'),
    specs = require('./specs.json');

// remove wordcloud due to random layout
specs = specs.filter(function(name) {
  return name !== 'wordcloud';
});

var GENERATE_SCENES = false, // flag to generate test scenes
    specdir = process.cwd() + '/spec/',
    testdir = process.cwd() + '/test/scenegraphs/',
    loader = vega.loader({baseURL: './web/'});

tape('Vega generates scenegraphs for specifications', function(test) {
  var count = specs.length;
  specs.forEach(function(name) {
    var path = testdir + name + '.json',
        spec = JSON.parse(fs.readFileSync(specdir + name + '.vg.json')),
        runtime = vega.parse(spec),
        view = new vega.View(runtime, {loader: loader, renderer: 'none'});

    view.initialize().runAsync().then(function() {
      var actual = view.scenegraph().toJSON();
      if (GENERATE_SCENES) {
        // eslint-disable-next-line no-console
        console.log('WRITING TEST SCENE', name, path);
        fs.writeFileSync(path, actual);
      } else {
        var expect = fs.readFileSync(path) + '';
        test.equal(expect, actual, 'scene: ' + name);
      }
    }).catch(function(err) {
      // eslint-disable-next-line no-console
      console.error('ERROR', err);
      test.fail(name);
    }).then(function() {
      if (--count === 0) {
        global.document = cachedDoc;
        test.end();
      }
    });
  });
});
