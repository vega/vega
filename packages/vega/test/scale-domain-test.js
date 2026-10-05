import tape from 'tape';
import * as vega from '../index.js';

tape('Scale domain fields read date signal values', async t => {
  const spec = {
    data: [{name: 'table', values: [{date: '2020-06-01'}], format: {parse: {date: 'date'}}}],
    scales: [{
      name: 'x',
      type: 'time',
      domain: {
        fields: [
          {data: 'table', field: 'date'},
          {signal: '[datetime(2019, 0, 1), datetime(2021, 0, 1)]'}
        ]
      }
    }]
  };

  const view = await new vega.View(vega.parse(spec), {renderer: 'none'}).runAsync();
  const [min, max] = view.scale('x').domain();
  t.equal(+min, +new Date(2019, 0, 1));
  t.equal(+max, +new Date(2021, 0, 1));
  t.end();
});
