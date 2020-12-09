var tape = require('tape'),
    vega = require('vega-dataflow'),
    Bounds = require('vega-scenegraph').Bounds,
    Collect = require('vega-transforms').collect,
    tx = require('../'),
    Overlap = tx.overlap;

function items() {
  const mark = {bounds: new Bounds(0, 0, 20, 10)};
  return [
    {opacity: 1, mark: mark, bounds: new Bounds().set( 0, 0,  3, 10)},
    {opacity: 1, mark: mark, bounds: new Bounds().set( 5, 0, 20, 10)},
    {opacity: 1, mark: mark, bounds: new Bounds().set(10, 0, 18, 10)}
  ];
}

function toObject(value) {
  return JSON.parse(JSON.stringify(value));
}

tape('Overlap removes overlapping items (parity)', t => {
  var data = items(),
      df = new vega.Dataflow(),
      co = df.add(Collect),
      ov = df.add(Overlap, {method: 'parity', pulse: co});

  df.pulse(co, df.changeset().insert(data)).run();

  // overlap sets proper opacity values
  t.equal(ov.pulse.add.length, 3);
  t.equal(data[0].opacity, 1);
  t.equal(data[1].opacity, 0);
  t.equal(data[2].opacity, 1);

  // overlap updates mark bounds
  t.deepEqual(
    toObject(data[0].mark.bounds),
    {x1: 0, y1: 0, x2: 18, y2: 10}
  );

  t.end();
});

tape('Overlap removes overlapping items (greedy)', t => {
  var data = items(),
      df = new vega.Dataflow(),
      co = df.add(Collect),
      ov = df.add(Overlap, {method: 'greedy', pulse: co});

  // add extra item to test greedy strategy
  data.push({
    opacity: 1,
    mark: data[0].mark,
    bounds: new Bounds().set(30, 0, 35, 10)
  });

  df.pulse(co, df.changeset().insert(data)).run();

  // overlap sets proper opacity values
  t.equal(ov.pulse.add.length, 4);
  t.equal(data[0].opacity, 1);
  t.equal(data[1].opacity, 1);
  t.equal(data[2].opacity, 0);
  t.equal(data[3].opacity, 1);

  // overlap updates mark bounds
  t.deepEqual(
    toObject(data[0].mark.bounds),
    {x1: 0, y1: 0, x2: 35, y2: 10}
  );

  t.end();
});
