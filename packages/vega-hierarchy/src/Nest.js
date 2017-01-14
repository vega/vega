import {Transform, tupleid} from 'vega-dataflow';
import {array, error, inherits} from 'vega-util';
import {nest} from 'd3-collection';
import {hierarchy} from 'd3-hierarchy';

 /**
  * Nest tuples into a tree structure, grouped by key values.
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {Array<function(object): *>} params.keys - The key fields to nest by, in order.
  * @param {function(object): *} [params.key] - Unique key field for each tuple.
  *   If not provided, the tuple id field is used.
  */
export default function Nest(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Nest, Transform);

function children(n) {
  return n.values;
}

prototype.transform = function(_, pulse) {
  if (!pulse.source) {
    error('Nest transform requires an upstream data source.');
  }

  var key = _.key || tupleid,
      root, tree, map, mod;

  if (!this.value || (mod = _.modified()) || pulse.changed()) {
    root = array(_.keys)
      .reduce(function(n, k) { return (n.key(k), n)}, nest())
      .entries(pulse.source);
    tree = hierarchy({values: root}, children);
    map = tree.lookup = {};
    tree.each(function(node) {
      if (tupleid(node.data) != null) map[key(node.data)] = node;
    });
    this.value = tree;
  }

  pulse.source.root = this.value;
  return mod ? pulse.fork(pulse.ALL) : pulse;
};
