import {Transform} from 'vega-dataflow';
import {Item, GroupItem} from 'vega-scenegraph';
import {inherits} from 'vega-util';

/**
 * Bind scenegraph items to a scenegraph mark instance.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.markdef - The mark definition for creating the mark.
 *   This is an object of legal scenegraph mark properties which *must* include
 *   the 'marktype' property.
 * @param {Array<number>} params.scenepath - Scenegraph tree coordinates for the mark.
 *   The path is an array of integers, each indicating the index into
 *   a successive chain of items arrays.
 */
export default function Mark(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Mark, Transform);

prototype.transform = function(_, pulse) {
  var mark = this.value;

  // acquire mark on first invocation
  if (!mark) {
    mark = pulse.dataflow.scenegraph().mark(_.scenepath, _.markdef);
    mark.source = this;
    this.value = mark;
    mark.group.context = _.scenepath.context;
  }

  // initialize entering items
  var Init = mark.marktype === 'group' ? GroupItem : Item;
  pulse.visit(pulse.ADD, function(item) { Init.call(item, mark); });

  // bind items array to scenegraph mark
  return (mark.items = pulse.source, pulse);
};
