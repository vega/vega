import config from '../../rollup.config.js';

// The shared config only builds each package's main entry point, so add `vega/base`
// here as a copy of the main module bundle with a different input and output.
export default function(commandLineArgs) {
  const outputs = config(commandLineArgs);
  const [indexBuild] = outputs;
  return [
    ...outputs,
    {
      ...indexBuild,
      input: './base.js',
      output: {...indexBuild.output, file: './build/vega-base.module.js'}
    }
  ];
}
