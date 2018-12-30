module.exports = function(type) {
  const helpText = `Render a Vega specification to ${type.toUpperCase()}.
Usage: vg2${type} [vega_json_spec_file] [output_${type}_file]
  If no arguments are provided, reads from stdin.
  If output_${type}_file is not provided, writes to stdout.

To load data, you may need to set a base directory:
  For web retrieval, use '-b http://host/data/'.
  For files, use '-b file:///dir/data/' (absolute) or '-b data/' (relative).`;

  const args = require('yargs')
    .usage(helpText)
    .demand(0);

  args.string('b')
    .alias('b', 'base')
    .describe('b', 'Base directory for data loading. Defaults to the directory of the input spec.');

  args.string('c')
    .alias('c', 'config')
    .describe('c', 'Vega config object. Either a JSON file or a .js file that exports the config object.');

  if (type === 'svg') {
    args.boolean('h')
      .alias('h', 'header')
      .describe('h', 'Include XML header and SVG doctype.');
  }

  args.number('s')
    .alias('s', 'scale')
    .default('s', 1)
    .describe('s', 'Output resolution scale factor.');

  args.number('seed')
    .describe('seed', 'Seed for random number generation.');

  return args.help().version().argv;
};