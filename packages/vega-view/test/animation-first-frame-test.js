import tape from 'tape';
import {extend} from 'vega-util';
import {transforms} from 'vega-dataflow';
import * as vegaTransforms from '../../vega-transforms/index.js';
import {View} from '../index.js';
import {parse} from '../../vega-parser/index.js';

extend(transforms, vegaTransforms);

// Minimal stand-in for the signals the Vega-Lite compiler emits for an
// animation selection: a frame value, a selection tuple, and a modify call.
const spec = {
  data: [
    {name: 'frame_store'},
    {
      name: 'source',
      values: [{v: 'a', f: 1}, {v: 'b', f: 2}, {v: 'c', f: 3}]
    },
    {
      name: 'source_curr',
      source: 'source',
      transform: [{
        type: 'filter',
        expr: '!length(data("frame_store")) || vlSelectionTest("frame_store", datum)'
      }]
    }
  ],
  signals: [
    {name: 'anim_clock', value: 0},
    {name: 'anim_value', update: 'anim_clock + 1'},
    {name: 'frame_tuple_fields', value: [{type: 'E', field: 'f'}]},
    {
      name: 'frame_tuple',
      update: '{unit: "", fields: frame_tuple_fields, values: [anim_value]}'
    },
    {
      name: 'frame_modify',
      update: 'modify("frame_store", frame_tuple, true)'
    }
  ]
};

tape('View populates an animation selection store on the first run', async t => {
  const view = new View(parse(spec), {renderer: 'none'});

  await view.runAsync();

  t.deepEqual(
    view.data('frame_store').map(d => d.values),
    [[1]],
    'store holds the first frame tuple'
  );
  t.deepEqual(
    view.data('source_curr').map(d => d.v),
    ['a'],
    'only first frame rows pass the filter'
  );
  t.end();
});
