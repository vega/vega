const OUTPUT_FAILURES = false; // flag to write scenes upon test failure
const specdir = process.cwd() + '/../vega/test/specs-valid/';
const testdir = process.cwd() + '/../vega/test/scenegraphs/';
const fs = require('fs');
const tape = require('tape');
const vega = require('vega');
const interp = require('../');
const loader = vega.loader({baseURL: '../vega/test/'});
const specs = require('../../vega/test/specs-valid.json').filter(spec => {
  // filter wordcloud due to cross-platform canvas issues
  return spec !== 'wordcloud';
});

// Plug-in a seeded random number generator for testing.
vega.setRandom(vega.randomLCG(123456789));

// Standardize font metrics to suppress cross-platform variance.
vega.textMetrics.canvas(false);

tape('Vega generates scenegraphs for specifications', t => {
  let count = specs.length;

  specs.forEach(async function(name, index) {
    try {
      const path = testdir + name + '.json';
      const spec = JSON.parse(fs.readFileSync(specdir + name + '.vg.json'));
      const runtime = vega.parse(spec, null, {ast: true});
      const view = new vega.View(runtime, {
        expr: interp.expressionInterpreter,
        loader: loader,
        renderer: 'none'
      }).finalize();

      await view.runAsync();

      const actual = view.scenegraph().toJSON(2);
      const expect = fs.readFileSync(path) + '';
      const pair = [JSON.parse(actual), JSON.parse(expect)];
      const isEqual = vega.sceneEqual(...pair);

      if (OUTPUT_FAILURES && !isEqual) {
        pair.forEach((scene, i) => {
          const prefix = vega.pad(index, 2, '0', 'left');
          fs.writeFileSync(
            `${prefix}-scene-${i?'expect':'actual'}-${name}.json`,
            JSON.stringify(scene, 0, 2)
          );
        });
      }

      t.ok(isEqual, 'scene: ' + name);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('ERROR', err);
      t.fail(name);
    } finally {
      if (--count === 0) t.end();
    }
  });
});
