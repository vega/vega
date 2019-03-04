var // flag to generate test scenes
    GENERATE_SCENES = false,
    // flag to write scenes upon test failure
    OUTPUT_FAILURES = false,
    TIMEOUT = 90000,
    specdir = __dirname + '/specs-valid/',
    testdir = __dirname + '/scenegraphs/',
    fs = require('fs'),
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

test('Vega generates scenegraphs for specifications', async function() {
  for (let i = 0; i < specs.length; i++) {
    const name = specs[i];

    const path = testdir + name + '.json',
          spec = JSON.parse(fs.readFileSync(specdir + name + '.vg.json')),
          runtime = vega.parse(spec),
          view = new vega.View(runtime, {loader: loader, renderer: 'none'});

    await view.runAsync();

    const actual = view.scenegraph().toJSON(2);
    if (GENERATE_SCENES) {
      // eslint-disable-next-line no-console
      console.log('WRITING TEST SCENE', name, path);
      fs.writeFileSync(path, actual);
    } else {
      const expected = fs.readFileSync(path) + '',
            pair = [JSON.parse(actual), JSON.parse(expected)],
            isEqual = vega.sceneEqual(...pair);

      if (OUTPUT_FAILURES && !isEqual) {
        pair.forEach((scene, i) => {
          var prefix = vega.pad(i, 2, '0', 'left');
          fs.writeFileSync(
            `${prefix}-scene-${i?'expect':'actual'}-${name}.json`,
            JSON.stringify(scene, 0, 2)
          );
        });
      }

      if (!isEqual) {
        // eslint-disable-next-line no-console
        console.error(name, 'has wrong scenegraph');
      }
      expect(isEqual).toBe(true);
    }

    view.finalize();
  }
}, TIMEOUT);
