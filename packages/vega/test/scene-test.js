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

function lcg(seed) {
  // Random numbers using a Linear Congruential Generator with seed value
  // Uses glibc values from https://en.wikipedia.org/wiki/Linear_congruential_generator
  return function() {
    seed = (1103515245 * seed + 12345) % 2147483647;
    return seed / 2147483647;
  };
}

// Plug-in a seeded random number generator for testing.
vega.setRandom(lcg(123456789));

// Standardize font metrics to suppress cross-platform variance.
vega.textMetrics.canvas(false);

tape('Vega generates scenegraphs for specifications', function(t) {
  var count = specs.length;
  specs.forEach(function(name, index) {
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
            pair = [JSON.parse(actual), JSON.parse(expect)],
            isEqual = vega.sceneEqual(...pair);

        if (OUTPUT_FAILURES && !isEqual) {
          pair.forEach((scene, i) => {
            var prefix = vega.pad(index, 2, '0', 'left');
            fs.writeFileSync(
              `${prefix}-scene-${i?'expect':'actual'}-${name}.json`,
              JSON.stringify(scene, 0, 2)
            );
          });
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
