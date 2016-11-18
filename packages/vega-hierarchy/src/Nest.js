import {Transform} from 'vega-dataflow';
import {array, error, inherits} from 'vega-util';
import {nest} from 'd3-collection';
import {hierarchy} from 'd3-hierarchy';

 /**
  * Nest tuples into a tree structure, grouped by key values.
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {Array<function(object): *>} params.keys - The key fields to nest by, in order.
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

  var root, tree, map, mod;

  if (!this.value || (mod = _.modified()) || pulse.changed()) {
    root = array(_.keys)
      .reduce(function(n, k) { return (n.key(k), n)}, nest())
      .entries(pulse.source);
    tree = hierarchy({values: root}, children);
    map = tree.lookup = {};
    tree.each(function(node) { if ('_id' in node.data) map[node.data._id] = node; });
    this.value = tree;
  }

  pulse.source.root = this.value;

  return mod ? pulse.fork(pulse.ALL) : pulse;
};
