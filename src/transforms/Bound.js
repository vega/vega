import {Transform} from 'vega-dataflow';
import {Marks} from 'vega-scenegraph';
import {inherits} from 'vega-util';

/**
 * Calculate bounding boxes for scenegraph items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.mark - The scenegraph mark instance to bound.
 */
export default function Bound(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Bound, Transform);

prototype.transform = function(_, pulse) {
  var mark = _.mark,
      type = Marks[mark.marktype],
      bound = type.bound,
      markBounds = mark.bounds, rebound;

  if (type.nested) {
    // multi-item marks have a single bounds instance
    boundItem(mark, bound);
  }

  else if (_.modified()) {
    // operator parameters modified -> re-bound all items
    // updates group bounds in response to modified group content
    markBounds.clear();
    mark.items.forEach(function(item) {
      markBounds.union(boundItem(item, bound));
    });
  }

  else {
    // incrementally update bounds, re-bound mark as needed
    rebound = pulse.changed(pulse.REM);

    pulse.visit(pulse.ADD, function(item) {
      markBounds.union(boundItem(item, bound));
    });

    pulse.visit(pulse.MOD, function(item) {
      rebound = rebound || markBounds.alignsWith(item.bounds);
      markBounds.union(boundItem(item, bound));
    });

    if (rebound) {
      markBounds.clear();
      mark.items.forEach(function(item) { markBounds.union(item.bounds); });
    }
  }

  return pulse.modifies('bounds');
};

function boundItem(item, bound, opt) {
  item['bounds:prev'].clear().union(item.bounds);
  return bound(item.bounds.clear(), item, opt);
}
