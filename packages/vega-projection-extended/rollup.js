var rollup = require('rollup'),
    {nodeResolve} = require('@rollup/plugin-node-resolve'),
    externals = process.argv[2] === '-e',
    output = 'vega-projections' + (externals ? '-core' : '') + '.js';

var modules = ['vega-projection'].concat(
  externals ? ['d3-array', 'd3-geo'] : []
);

rollup.rollup({
  input: 'index.js',
  external: modules,
  plugins: [
    nodeResolve({
      modulesOnly: true,
      customResolveOptions: { preserveSymlinks: false }
    })
  ]
}).then(bundle => {
  const module_globals = {};
  modules.forEach(_ => module_globals[_] = 'd3');
  module_globals['vega-projection'] = 'vega';

  return bundle.write({
    file: 'build/' + output,
    format: 'umd',
    name: 'vega',
    globals: module_globals
  });
}).then(() => {
  // eslint-disable-next-line
  console.warn('↳ build/' + output);
}).catch(abort);

function abort(error) {
  // eslint-disable-next-line
  console.error(error.stack);
}
