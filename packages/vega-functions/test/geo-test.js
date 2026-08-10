import tape from 'tape';
import { registerScale } from 'vega-scale';
import { geoScale, geoTranslate } from '../index.js';

tape('geoScale and geoTranslate return projection parameters', t => {
  const projection = registerScale(() => {});
  projection.scale = () => 150;
  projection.translate = () => [320, 180];

  const context = {
    context: {
      scales: {
        projection: { value: projection }
      }
    }
  };

  t.equal(geoScale.call(context, 'projection'), 150);
  t.deepEqual(geoTranslate.call(context, 'projection'), [320, 180]);
  t.equal(geoTranslate.call(context, 'missing'), undefined);
  t.end();
});
