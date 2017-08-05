var GENERATE_SCENES = false, // flag to generate test scenes
    specdir = process.cwd() + '/test/specs-valid/',
    testdir = process.cwd() + '/test/scenegraphs/',
    fs = require('fs'),
    tape = require('tape'),
    vega = require('../'),
    loader = vega.loader({baseURL: 'test/'}),
    specs = require('./specs-valid.json').filter(function(name) {
      // remove wordcloud due to random layout
      return name !== 'wordcloud';
    });

// Standardize font metrics to suppress cross-platform variance.
vega.textMetrics.canvas(false);

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
        test.ok(vega.sceneEqual(JSON.parse(actual), JSON.parse(expect)), 'scene: ' + name);
      }
    }).catch(function(err) {
      // eslint-disable-next-line no-console
      console.error('ERROR', err);
      test.fail(name);
    }).then(function() {
      if (--count === 0) test.end();
    });
  });
});
