const GENERATE_SCENES = false; // flag to generate test scenes
const OUTPUT_FAILURES = false; // flag to write scenes upon test failure
const specdir = process.cwd() + '/test/specs-valid/';
const testdir = process.cwd() + '/test/scenegraphs/';
const fs = require('fs');
const tape = require('tape');
const vega = require('../');
const loader = vega.loader({baseURL: 'test/'});
const specs = require('./specs-valid.json').filter(function (spec) {
  // filter wordcloud due to cross-platform canvas issues
  return spec !== 'wordcloud';
});

// Plug-in a seeded random number generator for testing.
vega.setRandom(vega.randomLCG(123456789));

// Standardize font metrics to suppress cross-platform variance.
vega.textMetrics.canvas(false);

tape('Vega generates scenegraphs for specifications', function (t) {
  let count = specs.length;

  specs.forEach(async function (name, index) {
    const path = testdir + name + '.json';
    const spec = JSON.parse(fs.readFileSync(specdir + name + '.vg.json'));
    const runtime = vega.parse(spec);
    const view = new vega.View(runtime, {
      loader: loader,
      renderer: 'none'
    }).finalize(); // remove timers, event listeners

    try {
      await view.runAsync();

      const actual = view.scenegraph().toJSON(2);
      if (GENERATE_SCENES) {
        // eslint-disable-next-line no-console
        console.log('WRITING TEST SCENE', name, path);
        fs.writeFileSync(path, actual);
      } else {
        const expect = fs.readFileSync(path) + '';
        const pair = [JSON.parse(actual), JSON.parse(expect)];
        const isEqual = vega.sceneEqual(...pair);

        if (OUTPUT_FAILURES && !isEqual) {
          pair.forEach((scene, i) => {
            const prefix = vega.pad(index, 2, '0', 'left');
            fs.writeFileSync(`${prefix}-scene-${i ? 'expect' : 'actual'}-${name}.json`, JSON.stringify(scene, 0, 2));
          });
        }

        t.ok(isEqual, 'scene: ' + name);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('ERROR', err);
      t.fail(name);
    } finally {
      if (--count === 0) t.end();
    }
  });
});
