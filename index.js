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
  parse: {
    spec: require('./src/parse/spec')
  },
  scene: {
    Builder: require('./src/scene/Builder'),
    GroupBuilder: require('./src/scene/GroupBuilder')
  },
  transforms: require('./src/transforms/index'),
  config: require('./src/util/config'),
  util: require('datalib')
};