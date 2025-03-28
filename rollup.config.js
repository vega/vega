/* eslint-disable no-console */
import { readFile } from 'fs/promises';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import bundleSize from 'rollup-plugin-bundle-size';

const pkg = JSON.parse(await readFile('./package.json'));

const d3Deps = [
  'd3-array',
  'd3-color',
  'd3-dispatch',
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
  'd3-delaunay'
];

const d3CoreDeps = [
  ...d3Deps,
  'topojson-client'
];

function onwarn(warning, defaultHandler) {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    defaultHandler(warning);
  }
}

/**
 * Command line arguments:
 *  `config-debug`: print debug information about the build
 *  `config-node`: the module is only intended for node
 *  `config-test`: skip bundles not required for tests
 */
export default function(commandLineArgs) {
  const debug = !!commandLineArgs['config-debug'];

  if (debug) {
    console.info(pkg);
    console.info(commandLineArgs);
  }

  const bundle = !!pkg.jsdelivr; // we are building the bundle for vega core package
  const browser = !!pkg.exports.node;  // if there is a node entry point, we need to create a browser bundle
  const node = !!commandLineArgs['config-node'];
  const test = !!commandLineArgs['config-test'];

  const dependencies = Object.keys(pkg.dependencies || {});

  const globals = {};
  for (const dep of [...dependencies, ...d3CoreDeps]) {
    if (dep.startsWith('d3')) {
      globals[dep] = 'd3';
    } else if (dep.startsWith('vega-')) {
      globals[dep] = 'vega';
    } else if (dep.startsWith('topojson-')) {
      globals[dep] = 'topojson';
    }
  }

  function commonPlugins(targets) {
    if (debug) {
      console.log(targets);
    }

    return [
      json(),
      babel({
        presets: [[
          '@babel/preset-env',
          {
            targets,
            debug
          }
        ]],
        babelHelpers: 'bundled',
        extensions: ['.js', '.ts'],
        generatorOpts: { 'importAttributesKeyword': 'with' }
      }),
      bundleSize()
    ];
  }

  function nodePlugin(browser) {
    return nodeResolve({
      browser,
      modulesOnly: true,
      customResolveOptions: { preserveSymlinks: false }
    });
  }

  const outputs = [];

  const defaultExport = pkg.exports.default || pkg.exports['.'].default;

  // unless we have a node-only package, output a browser bundle
  if (!node) {
    outputs.push({
      input: browser ? './index.browser.js' :  './index.js',
      external: dependencies,
      onwarn,
      output: {
        file: defaultExport,
        format: 'esm',
        sourcemap: true
      },
      plugins: [nodePlugin(true), ...commonPlugins('defaults')]
    });
  }

  // if we need a node-only package or separate bundles for browser and node, create a node bundle
  if (browser || node) {
    outputs.push({
      input: './index.js',
      external: dependencies,
      onwarn,
      output: {
        file: node ? defaultExport : pkg.exports.node,
        format: 'esm',
        sourcemap: true
      },
      plugins: [nodePlugin(false), ...commonPlugins({node: true})]
    });
  }

  if (test) {
    return outputs;
  }

  function bundleOutputs(output) {
    return [{
      ...output,
      plugins: [terser()]
    }, {
      ...output,
      file: output.file.replace('.min', '')
    }];
  }

  if (bundle) {
    outputs.push({
      input: './index.js',
      onwarn,
      output: bundleOutputs({
        file: pkg.jsdelivr,
        format: 'umd',
        sourcemap: true,
        globals,
        name: 'vega'
      }),
      plugins: [nodePlugin(true), ...commonPlugins('defaults')]
    });

    // Create UMD bundle without d3 (core bundle)
    outputs.push({
      input: './index.js',
      external: d3CoreDeps,
      onwarn,
      output: bundleOutputs({
        file: pkg.jsdelivr.replace('.min.js', '-core.min.js'),
        format: 'umd',
        sourcemap: true,
        globals,
        name: 'vega'
      }),
      plugins: [nodePlugin(true), ...commonPlugins('defaults')]
    });
  }

  if (debug) {
    console.info(outputs);
  }

  return outputs;
}
