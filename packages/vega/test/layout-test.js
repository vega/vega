import tape from 'tape';
import * as vega from '../index.js';

tape('Grid layout preserves fractional group spacing', async t => {
  for (const bounds of ['full', 'flush']) {
    const spec = {
      layout: {bounds, columns: 2, padding: 2},
      marks: Array.from({length: 3}, () => ({
        type: 'group',
        encode: {update: {width: {value: 10.25}, height: {value: 7.5}}}
      }))
    };
    const view = new vega.View(vega.parse(spec), {renderer: 'none'});
    try {
      await view.runAsync();
      const positions = view.scenegraph().root.items[0].items.map(mark => {
        const {x, y} = mark.items[0];
        return [x, y];
      });
      t.deepEqual(positions, [[0, 0], [12.25, 0], [0, 9.5]], bounds);
    } finally {
      view.finalize();
    }
  }
  t.end();
});
