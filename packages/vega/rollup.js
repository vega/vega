const rollup = require('rollup'),
      json = require('rollup-plugin-json'),
      nodeResolve = require('rollup-plugin-node-resolve'),
      esmodule = hasArgument('-m'),
      externals = esmodule || hasArgument('-e'),
      output = `vega${esmodule ? '-module' : externals ? '-core' : ''}.js`;

function hasArgument(_) {
  return process.argv.slice(2).some(a => a === _);
}

const external = [].concat(!externals ? [] : [
  'd3-array',
  'd3-color',
  'd3-contour',
  'd3-dsv',
  'd3-force',
  'd3-format',
  'd3-geo',
  'd3-hierarchy',
  'd3-interpolate',
  'd3-path',
  'd3-scale',
  'd3-shape',
  'd3-time',
  'd3-time-format',
  'd3-timer',
  'd3-delaunay',
  'topojson-client'
]);

const options = {
  file: 'build/' + output,
  format: 'es'
};

if (!esmodule) Object.assign(options, {
  format: 'umd',
  name: 'vega',
  globals: external.reduce(function(map, _) {
    map[_] = _.split('-')[0]; // map package name to prefix
    return map;
  }, {})
});

rollup.rollup({
  input: 'index.js',
  external: external,
  plugins: [
    nodeResolve({browser: true}),
    json()
  ],
  onwarn: function(warning) {
    // suppress circular dependency warnings
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      console.warn(warning.code, warning.message);
    }
  }
}).then(function(bundle) {
  return bundle.write(options);
}).then(function() {
  console.warn('↳ build/' + output);
}).catch(abort);

function abort(error) {
  console.error(error.stack);
}
