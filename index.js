module.exports = {
  core: {
    View: require('./src/core/View')
  },
  dataflow: require('vega-dataflow'),
  parse: require('./src/parse/'),
  scene: {
    Builder: require('./src/scene/Builder'),
    GroupBuilder: require('./src/scene/GroupBuilder')
  },
  transforms: require('./src/transforms/'),
  config: require('./src/util/config'),
  util: require('datalib/src/util'),
  schema: require('./src/util/schema'),
  debug: require('vega-logging').debug
};