const rollup = require('rollup'),
      json = require('@rollup/plugin-json'),
      {nodeResolve} = require('@rollup/plugin-node-resolve'),
      esmodule = hasArgument('-m'),
      externals = esmodule || hasArgument('-e'),
      output = `vega${esmodule ? '-module' : externals ? '-core' : ''}.js`;

function hasArgument(_) {
  return process.argv.slice(2).some(a => a === _);
}

const external = !externals ? [] : [
  // 'd3-array', // we use d3-array v2, not part of D3 v5
  'd3-color',
  'd3-dispatch',
  'd3-dsv',
  'd3-force',
  'd3-format',
  'd3-geo',
  'd3-hierarchy',
  'd3-interpolate',
  'd3-path',
  // 'd3-scale', // we use d3-scale v3, not part of D3 v5
  'd3-shape',
  'd3-time',
  'd3-time-format',
  'd3-timer',
  // 'd3-delaunay', // not part of D3 v5
  'topojson-client'
];

const options = {
  file: 'build/' + output,
  format: 'es'
};

if (!esmodule) {
  Object.assign(options, {
    format: 'umd',
    name: 'vega',
    // map package name to prefix
    globals: external.reduce((map, _) => (map[_] = _.split('-')[0], map), {})
  });
}

rollup.rollup({
  input: 'index.js',
  external: external,
  plugins: [
    nodeResolve({
      browser: true,
      modulesOnly: true,
      customResolveOptions: { preserveSymlinks: false }
    }),
    json()
  ],
  onwarn: warning => {
    // suppress circular dependency warnings
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      // eslint-disable-next-line
      console.warn(warning.code, warning.message);
    }
  }
}).then(bundle => {
  return bundle.write(options);
}).then(() => {
  // eslint-disable-next-line
  console.warn('↳ build/' + output);
}).catch(abort);

function abort(error) {
  // eslint-disable-next-line
  console.error(error.stack);
}
