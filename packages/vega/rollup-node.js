var rollup = require('rollup'),
    json = require('rollup-plugin-json'),
    dependencies = require('./package.json').dependencies,
    output = 'vega-node.js';

rollup.rollup({
  input: 'index.js',
  external: Object.keys(dependencies),
  plugins: [json()],
}).then(function(bundle) {
  return bundle.write({
    file: 'build/' + output,
    format: 'cjs'
  });
}).then(function() {
  console.warn('↳ build/' + output);
}).catch(abort);

function abort(error) {
  console.error(error.stack);
}
