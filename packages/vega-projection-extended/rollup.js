const rollup = require('rollup');
const resolve = require('@rollup/plugin-node-resolve');
const externals = process.argv[2] === '-e';
const output = 'vega-projections' + (externals ? '-core' : '') + '.js';

const modules = ['vega-projection'].concat(!externals ? [] : ['d3-array', 'd3-geo']);

const module_globals = modules.reduce(function (map, _) {
  return (map[_] = 'd3'), map;
}, {});
module_globals['vega-projection'] = 'vega';

rollup
  .rollup({
    input: 'index.js',
    external: modules,
    plugins: [
      resolve({
        customResolveOptions: {preserveSymlinks: false}
      })
    ]
  })
  .then(function (bundle) {
    return bundle.write({
      file: 'build/' + output,
      format: 'umd',
      name: 'vega',
      globals: module_globals
    });
  })
  .then(function () {
    // eslint-disable-next-line
  console.warn('↳ build/' + output);
  })
  .catch(abort);

function abort(error) {
  // eslint-disable-next-line
  console.error(error.stack);
}
