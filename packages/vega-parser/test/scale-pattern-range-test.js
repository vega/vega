import tape from 'tape';
import { parse } from '../index.js';

tape('Parser accepts pattern wrapper objects in ordinal scale range', t => {
  const spec = {
    data: [{
      name: 'table',
      values: [
        {c: 'A', v: 1},
        {c: 'B', v: 2},
        {c: 'C', v: 3}
      ]
    }],
    scales: [{
      name: 'c',
      type: 'ordinal',
      domain: {data: 'table', field: 'c'},
      range: [
        {pattern: {name: 'crosshatch', foreground: 'seagreen'}},
        'goldenrod',
        {pattern: {rule: {angle: 45, spacing: 5}, foreground: 'navy'}}
      ]
    }]
  };

  const dfs = parse(spec);
  const scaleOps = dfs.operators.filter(o => o.type === 'scale');
  // After finish(), scale names are annotated on operator.scale
  const cScale = scaleOps.find(o => o.scale === 'c');
  t.ok(cScale, 'found scale operator');
  t.ok(Array.isArray(cScale.params.range), 'range is array');
  t.equal(cScale.params.range.length, 3, 'range has 3 entries');
  t.deepEqual(
    cScale.params.range[0],
    {pattern: {name: 'crosshatch', foreground: 'seagreen'}},
    'pattern wrapper passes through untouched'
  );
  t.equal(cScale.params.range[1], 'goldenrod', 'plain colors still pass through');
  t.deepEqual(
    cScale.params.range[2],
    {pattern: {rule: {angle: 45, spacing: 5}, foreground: 'navy'}},
    'inline rule pattern passes through untouched'
  );
  t.end();
});

tape('Parser still rejects unsupported objects in scale parameters', t => {
  const spec = {
    data: [{name: 'table', values: [{c: 'A'}]}],
    scales: [{
      name: 'c',
      type: 'ordinal',
      domain: {data: 'table', field: 'c'},
      range: [{gradient: 'linear'}]
    }]
  };

  t.throws(() => parse(spec), /Unsupported object/, 'non-pattern objects error');
  t.end();
});
