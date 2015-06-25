module.exports = {
  dataflow: require('vega-dataflow'),
  parse: require('./src/parse/'),
  scene: {
    Bounder: require('./src/scene/Bounder'),
    Builder: require('./src/scene/Builder'),
    Encoder: require('./src/scene/Encoder'),
    GroupBuilder: require('./src/scene/GroupBuilder'),
  },
  transforms: require('./src/transforms/'),
  config: require('./src/util/config'),
  util: require('datalib/src/util'),
  schema: require('./src/util/schema'),
  debug: require('vega-logging').debug
};