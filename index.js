module.exports = {
  version: '__VERSION__',
  dataflow: require('vega-dataflow'),
  parse: require('./src/parse/'),
  scene: {
    Bounder: require('./src/scene/Bounder'),
    Builder: require('./src/scene/Builder'),
    Encoder: require('./src/scene/Encoder'),
    GroupBuilder: require('./src/scene/GroupBuilder'),
  },
  transforms: require('./src/transforms'),
  schema: require('./src/core/schema'),
  config: require('./src/core/config'),
  util:  require('datalib'),
  debug: require('vega-logging').debug
};
