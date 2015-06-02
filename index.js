module.exports = {
  core: {
    View: require('./src/core/View')
  },
  dataflow: {
    changeset: require('./src/dataflow/changeset'),
    Datasource: require('./src/dataflow/Datasource'),
    Graph: require('./src/dataflow/Graph'),
    Node: require('./src/dataflow/Node')
  },
  parse: require('./src/parse/'),
  scene: {
    Builder: require('./src/scene/Builder'),
    GroupBuilder: require('./src/scene/GroupBuilder')
  },
  transforms: require('./src/transforms/'),
  config: require('./src/util/config'),
  util: require('datalib'),
  schema: require('./src/util/schema')
};