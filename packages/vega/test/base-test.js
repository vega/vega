import tape from 'tape';
import {execFileSync} from 'child_process';
import * as base from '../base.js';
import * as vega from '../index.js';

tape('vega/base exports the same API as vega', t => {
  t.deepEqual(Object.keys(base).sort(), Object.keys(vega).sort());
  t.end();
});

tape('vega/base does not register any transforms', t => {
  // Run in a separate process, since importing the main entry point in this one
  // registers every transform.
  const registeredTransforms = execFileSync(process.execPath, [
    '--input-type=module',
    '-e',
    'const {transforms} = await import(process.argv[1]); console.log(JSON.stringify(Object.keys(transforms)));',
    new URL('../base.js', import.meta.url).href
  ], {encoding: 'utf8'});
  t.deepEqual(JSON.parse(registeredTransforms), []);
  t.end();
});

tape('vega/base shares the transform registry with vega', async t => {
  // The transforms are already registered in this process by the main entry point,
  // so this checks that base and the main entry point share the same registry.
  t.equal(base.transforms, vega.transforms);
  const spec = {
    data: [{name: 'table', values: [{x: 1}, {x: 2}], transform: [{type: 'filter', expr: 'datum.x > 1'}]}]
  };
  const view = await new base.View(base.parse(spec), {renderer: 'none'}).runAsync();
  t.deepEqual(view.data('table'), [{x: 2}]);
  t.end();
});
