const specdir = process.cwd() + '/../vega/test/specs-valid/',
      fs = require('fs'),
      vega = require('vega'),
      interp = require('../'),
      loader = vega.loader({baseURL: '../vega/test/'}),
      renderer = 'none',
      expr = interp.expressionInterpreter,
      specs = require('../../vega/test/specs-valid.json');

// Plug-in a seeded random number generator for testing.
vega.setRandom(vega.randomLCG(123456789));

// Standardize font metrics to suppress cross-platform variance.
vega.textMetrics.canvas(false);

// initialize data collection
const data = {};
specs.forEach(name => { data[name] = [0, 0]; });

async function testStandard() {
  for (const name of specs) {
    const spec = JSON.parse(fs.readFileSync(specdir + name + '.vg.json')),
          t0 = Date.now(),
          runtime = vega.parse(spec);

    // expression interpreter
    await new vega.View(runtime, { loader, renderer })
      .finalize()
      .runAsync();

    data[name][0] = Date.now() - t0;
  }
}

async function testInterpret() {
  for (const name of specs) {
    const spec = JSON.parse(fs.readFileSync(specdir + name + '.vg.json')),
          t0 = Date.now(),
          runtime = vega.parse(spec, null, {ast: true});

    // expression interpreter
    await new vega.View(runtime, { expr, loader, renderer })
      .finalize()
      .runAsync();

    data[name][1] = Date.now() - t0;
  }
}

async function time() {
  const n = specs.length;

  // warmup for both code paths
  await testStandard();
  await testInterpret();

  // now do a timing run
  await testStandard();
  await testInterpret();

  let sumS = 0, sumI = 0;

  for (const k in data) {
    const ratio = data[k][0] === 0 ? 1 : (data[k][1] / data[k][0]);
    sumI += data[k][1];
    sumS += data[k][0];
    // eslint-disable-next-line no-console
    console.log(k, data[k][0], data[k][1], ratio.toFixed(2));
  }
  // eslint-disable-next-line no-console
  console.log('AVG', (sumS/n).toFixed(2), (sumI/n).toFixed(2),
    (sumS/sumI).toFixed(2), (sumI/sumS).toFixed(2));
}

time();
