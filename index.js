module.exports = {
  version: '__VERSION__',
  dataflow: require('vega-dataflow'),
  parse: require('./src/parse/'),
  scene: {
    Bounder: require('./src/scene/Bounder'),
    Builder: require('./src/scene/Builder'),
    Encoder: require('./src/scene/Encoder'),
    GroupBuilder: require('./src/scene/GroupBuilder'),
    visit: require('./src/scene/visit')
  },
  transforms: require('./src/transforms'),
  Transform: require('./src/transforms/Transform'),
  BatchTransform: require('./src/transforms/BatchTransform'),
  Parameter: require('./src/transforms/Parameter'),
  schema: require('./src/core/schema'),
  config: require('./src/core/config'),
  util: require('./src/util'),
  logging: require('vega-logging'),
  debug: require('vega-logging').debug
};
