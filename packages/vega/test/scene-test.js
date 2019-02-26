var GENERATE_SCENES = false, // flag to generate test scenes
    OUTPUT_FAILURES = false, // flag to write scenes upon test failure
    specdir = process.cwd() + '/test/specs-valid/',
    testdir = process.cwd() + '/test/scenegraphs/',
    fs = require('fs'),
    tape = require('tape'),
    vega = require('../'),
    loader = vega.loader({baseURL: 'test/'}),
    specs = require('./specs-valid.json').filter(function(spec) {
      // filter wordcloud due to cross-platform canvas issues
      return spec !== 'wordcloud';
    });

// Plug-in a seeded random number generator for testing.
vega.setRandom(vega.randomLCG(123456789));

// Standardize font metrics to suppress cross-platform variance.
vega.textMetrics.canvas(false);

tape('Vega generates scenegraphs for specifications', function(t) {
  var count = specs.length;
  specs.forEach(function(name) {
    var path = testdir + name + '.json',
        spec = JSON.parse(fs.readFileSync(specdir + name + '.vg.json')),
        runtime = vega.parse(spec),
        view = new vega.View(runtime, {loader: loader, renderer: 'none'});

    view.initialize().runAsync().then(function() {
      var actual = view.scenegraph().toJSON(2);
      if (GENERATE_SCENES) {
        // eslint-disable-next-line no-console
        console.log('WRITING TEST SCENE', name, path);
        fs.writeFileSync(path, actual);
      } else {
        var expect = fs.readFileSync(path) + '',
            actualJSON = JSON.parse(actual),
            expectJSON = JSON.parse(expect),
            isEqual = vega.sceneEqual(actualJSON, expectJSON);

        if (OUTPUT_FAILURES && !isEqual) {
          fs.writeFileSync(name + '-actual.json', JSON.stringify(actualJSON, 0, 2));
          fs.writeFileSync(name + '-expect.json', JSON.stringify(expectJSON, 0, 2));
        }

        t.ok(isEqual, 'scene: ' + name);
      }
    }).catch(function(err) {
      // eslint-disable-next-line no-console
      console.error('ERROR', err);
      t.fail(name);
    }).then(function() {
      view.finalize();
      if (--count === 0) t.end();
    });
  });
});
