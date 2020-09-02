/* eslint-disable no-console */

import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import bundleSize from 'rollup-plugin-bundle-size';
import { terser } from 'rollup-plugin-terser';

const pkg = require('./package.json');

const d3CoreDeps = [
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

/**
 * Command line arguments:
 *  `config-debug`: print debug information about the build
 *  `config-browser`: the module has different inputs for browser and node
 *  `config-bundle`: bundle dependencies in browser output
 *  `config-transform`: the module is a Vega transform
 *  `config-core`: create a bundle without d3
 *  `config-node`: the module is only intended for node
 *  `config-ie`: generate ie 11 compatible bundles in `build-es5`
 *  `config-test`: skip bundles not required for tests
 */
export default function(commandLineArgs) {
  const debug = !!commandLineArgs['config-debug'];

  if (debug) {
    console.info(pkg);
    console.info(commandLineArgs);
  }

  const browser = !!commandLineArgs['config-browser'];
  const bundle = !!commandLineArgs['config-bundle'];
  const ie = !!commandLineArgs['config-bundle'];
  const test = !!commandLineArgs['config-test'];

  const dependencies = Object.keys(pkg.dependencies || {});
  const coreExternal = d3CoreDeps;
  const vgDependencies = bundle ? [] : dependencies.filter(dep => dep.startsWith('vega-'));

  const name = commandLineArgs['config-transform'] ? 'vega.transforms' : 'vega';

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
        babelHelpers: 'runtime',
        extensions: ['.js', '.ts'],
        plugins: [['@babel/plugin-transform-runtime', {
          useESModules: true
        }]]
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
  
  const outputs = [{
    input: './index.js',
    external: dependencies,
    output: {
      file: pkg.main,
      format: pkg.main.includes('-node') ? 'cjs' : 'umd',
      globals,
      sourcemap: true,
      name
    },
    plugins: [nodePlugin(false), ...commonPlugins({node: true})]
  }, {
    input: browser ? './index.browser.js' : './index.js',
    external: dependencies,
    output: {
      file: pkg.module,
      format: 'esm',
      sourcemap: true
    },
    plugins: [nodePlugin(true), ...commonPlugins('defaults and not IE 11')]
  }];

  if (test) {
    return outputs;
  }

  /**
   * If `config-bundle` is true, create minified and long outputs.
   */
  function bundleOutputs(output) {
    if (bundle) {
      return [{
        ...output,
        plugins: [terser()]
      }, {
        ...output,
        file: output.file.replace('.min', '')
      }];
    } else {
      return {
        ...output,
        plugins: [terser()]
      };
    }
  }

  if (!commandLineArgs['config-node']) {
    outputs.push({
      input: browser ? './index.browser.js' : './index.js',
      external: [/@babel\/runtime/, ...vgDependencies],
      output: bundleOutputs({
        file: pkg.unpkg,
        format: 'iife',
        sourcemap: true,
        globals,
        name
      }),
      plugins: [nodePlugin(true), ...commonPlugins('defaults and not IE 11')]
    });

    if (ie) {
      outputs.push({
        input: browser ? './index.browser.js' : './index.js',
        external: [/@babel\/runtime/, ...vgDependencies],
        output: bundleOutputs({
          file: pkg.unpkg.replace('build/', 'build-es5/'),
          format: 'iife',
          sourcemap: true,
          globals,
          name
        }),
        plugins: [nodePlugin(true), ...commonPlugins('defaults')]
      });
    }
  }

  if (commandLineArgs['config-core']) {
    // Create bundle without d3 (core bundle)
    outputs.push({
      input: browser ? './index.browser.js' : './index.js',
      external: [/@babel\/runtime/, ...vgDependencies, ...coreExternal],
      output: bundleOutputs({
        file: pkg.unpkg.replace('.min.js', '-core.min.js'),
        format: 'iife',
        sourcemap: true,
        globals,
        name
      }),
      plugins: [nodePlugin(true), ...commonPlugins('defaults and not IE 11')]
    });

    if (ie) {
      outputs.push({
        input: browser ? './index.browser.js' : './index.js',
        external: [/@babel\/runtime/, ...vgDependencies, ...coreExternal],
        output: bundleOutputs({
          file: pkg.unpkg.replace('.min.js', '-core.min.js').replace('build/', 'build-es5/'),
          format: 'iife',
          sourcemap: true,
          globals,
          name
        }),
        plugins: [nodePlugin(true), ...commonPlugins('defaults')]
      });
    }
  }

  if (debug) {
    console.info(outputs);
  }

  return outputs;
}
