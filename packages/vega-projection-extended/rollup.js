var rollup = require('rollup'),
    resolve = require('@rollup/plugin-node-resolve'),
    externals = process.argv[2] === '-e',
    output = 'vega-projections' + (externals ? '-core' : '') + '.js';

var modules = ['vega-projection'].concat(!externals ? [] : [
  'd3-array',
  'd3-geo'
]);

var module_globals = modules.reduce(
  function(map, _) { return map[_] = 'd3', map; },
  {}
);
module_globals['vega-projection'] = 'vega';

rollup.rollup({
  input: 'index.js',
  external: modules,
  plugins: [
    resolve({
      customResolveOptions: { preserveSymlinks: false }
    })
  ]
}).then(function(bundle) {
  return bundle.write({
    file: 'build/' + output,
    format: 'umd',
    name: 'vega',
    globals: module_globals
  });
}).then(function() {
  // eslint-disable-next-line
  console.warn('↳ build/' + output);
}).catch(abort);

function abort(error) {
  // eslint-disable-next-line
  console.error(error.stack);
}
