module.exports = {
  core: {
    View: require('./core/View')
  },
  dataflow: {
    changeset: require('./dataflow/changeset'),
    Datasource: require('./dataflow/Datasource'),
    Graph: require('./dataflow/Graph'),
    Node: require('./dataflow/Node')
  },
  parse: {
    spec: require('./parse/spec')
  },
  scene: {
    Builder: require('./scene/Builder'),
    GroupBuilder: require('./scene/GroupBuilder')
  },
  transforms: require('./transforms/index'),
  util: require('./util/index'),
  config: require('./util/config')
};