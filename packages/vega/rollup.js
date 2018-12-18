const rollup = require('rollup'),
      json = require('rollup-plugin-json'),
      nodeResolve = require('rollup-plugin-node-resolve'),
      externals = process.argv[2] === '-e',
      output = externals ? 'vega-core.js' : 'vega.js';

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
  'd3-scale-chromatic',
  'd3-shape',
  'd3-time',
  'd3-time-format',
  'd3-timer',
  'd3-voronoi',
  'topojson-client'
]);

const globals = external.reduce(function(map, _) {
  map[_] = _.split('-')[0]; // map package name to prefix
  return map;
}, {});

rollup.rollup({
  input: 'index.js',
  external: external,
  plugins: [
    nodeResolve({module: true, browser: true}),
    json()
  ],
  onwarn: function(warning) {
    // suppress circular dependency warnings
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      console.warn(warning.code, warning.message);
    }
  }
}).then(function(bundle) {
  return bundle.write({
    file: 'build/' + output,
    format: 'umd',
    name: 'vega',
    globals: globals
  });
}).then(function() {
  console.warn('↳ build/' + output);
}).catch(abort);

function abort(error) {
  console.error(error.stack);
}
