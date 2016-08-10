import {Transform} from 'vega-dataflow';
import {error, inherits} from 'vega-util';
import {stratify} from 'd3-hierarchy';

 /**
  * Stratify a collection of tuples into a tree structure based on
  * id and parent id fields.
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {function(object): *} params.key - Unique key field for each tuple.
  * @param {function(object): *} params.parentKey - Field with key for parent tuple.
  */
export default function Stratify(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Stratify, Transform);

prototype.transform = function(_, pulse) {
  if (!pulse.source) {
    error('Stratify transform requires an upstream data source.');
  }

  var run = !this.value
         || _.modified()
         || pulse.changed(pulse.ADD_REM)
         || pulse.modified(_.key.fields)
         || pulse.modified(_.parentKey.fields);

  if (run) {
    var tree = stratify().id(_.key).parentId(_.parentKey)(pulse.source),
        map = tree.lookup = {};
    tree.each(function(node) { map[node.data._id] = node; });
    this.value = tree;
  }

  pulse.source.root = this.value;
};
