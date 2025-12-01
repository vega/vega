import baseConfig from '../../rollup.config.js';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import { existsSync } from 'fs';
import { dirname, resolve as pathResolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Custom plugin to resolve .js imports to .ts files for incremental migration
function resolveTypeScriptFiles() {
  return {
    name: 'resolve-ts-files',
    resolveId(source, importer) {
      // Only handle relative imports ending in .js
      if (!source.endsWith('.js') || (!source.startsWith('./') && !source.startsWith('../'))) {
        return null;
      }

      const importerDir = importer ? dirname(importer) : __dirname;
      const jsPath = pathResolve(importerDir, source);
      const tsPath = jsPath.replace(/\.js$/, '.ts');

      // If .ts exists and .js doesn't, resolve to .ts
      if (existsSync(tsPath) && !existsSync(jsPath)) {
        return tsPath;
      }

      return null;
    }
  };
}

export default function(commandLineArgs) {
  const configs = baseConfig(commandLineArgs);

  // Add TypeScript support for incremental migration
  return configs.map(config => ({
    ...config,
    plugins: [
      // First, resolve .js to .ts for converted files
      resolveTypeScriptFiles(),
      // Configure node-resolve to handle .ts extensions
      nodeResolve({
        extensions: ['.mjs', '.js', '.ts', '.json', '.node'],
        browser: config.output && config.output.format !== 'cjs',
        modulesOnly: true,
        customResolveOptions: { preserveSymlinks: false }
      }),
      // Add TypeScript plugin to compile .ts files
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: false
      }),
      // Add remaining plugins except the default node-resolve
      ...config.plugins.filter(p => p.name !== 'node-resolve')
    ]
  }));
}
