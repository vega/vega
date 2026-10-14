import config from '../../rollup.config.js';
import pkg from './package.json' with { type: 'json' };

// The shared config only builds each package's main entry point, so add `vega/base`
// here as a copy of the main ESM build with a different input and output.
export default function(commandLineArgs) {
  const outputs = config(commandLineArgs);
  const mainExport = pkg.exports['.'].default;
  const mainBuild = outputs.find(
    ({input, output}) => input === './index.js' && output.file === mainExport
  );
  if (!mainBuild) {
    throw new Error(
      `Could not find the build of ./index.js to ${mainExport} in the shared ` +
      'rollup config, which is needed to build vega/base.'
    );
  }
  return [
    ...outputs,
    {
      ...mainBuild,
      input: './base.js',
      output: {...mainBuild.output, file: pkg.exports['./base'].default}
    }
  ];
}
