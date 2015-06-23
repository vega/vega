module.exports = {
  core: {
    View: require('./src/core/View')
  },
  dataflow: {
    changeset: require('vega-dataflow/src/ChangeSet'),
    Datasource: require('vega-dataflow/src/DataSource'),
    Graph: require('vega-dataflow/src/Graph'),
    Node: require('vega-dataflow/src/Node')
  },
  parse: require('./src/parse/'),
  scene: {
    Builder: require('./src/scene/Builder'),
    GroupBuilder: require('./src/scene/GroupBuilder')
  },
  transforms: require('./src/transforms/'),
  config: require('./src/util/config'),
  util: require('datalib/src/util'),
  schema: require('./src/util/schema')
};