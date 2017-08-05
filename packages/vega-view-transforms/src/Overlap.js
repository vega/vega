import {Transform} from 'vega-dataflow';
import {inherits, peek} from 'vega-util';

/**
 * Analyze items for overlap, changing opacity to hide items with
 * overlapping bounding boxes. This transform will preserve at least
 * two items (e.g., first and last) even if overlap persists.
 * @param {object} params - The parameters for this operator.
 * @param {object} params.method - The overlap removal method to apply.
 *   One of 'parity' (default, hide every other item until there is no
 *   more overlap) or 'greedy' (sequentially scan and hide and items that
 *   overlap with the last visible item).
 * @constructor
 */
export default function Overlap(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Overlap, Transform);

var methods = {
  parity: function(items) {
    return items.filter(function(item, i) {
      return i % 2 ? (item.opacity = 0) : 1;
    });
  },
  greedy: function(items) {
    var a;
    return items.filter(function(b, i) {
      if (!i || !intersect(a.bounds, b.bounds)) {
        a = b;
        return 1;
      } else {
        return b.opacity = 0;
      }
    });
  }
};

// compute bounding box intersection
// allow 1 pixel of overlap tolerance
function intersect(a, b) {
  return !(
    a.x2 - 1 < b.x1 ||
    a.x1 + 1 > b.x2 ||
    a.y2 - 1 < b.y1 ||
    a.y1 + 1 > b.y2
  );
}

function hasOverlap(items) {
  for (var i=1, n=items.length, a=items[0].bounds, b; i<n; a=b, ++i) {
    if (intersect(a, b = items[i].bounds)) return true;
  }
}

function hasBounds(item) {
  var b = item.bounds;
  return b.width() > 1 && b.height() > 1;
}

prototype.transform = function(_, pulse) {
  var reduce = methods[_.method] || methods.parity,
      source = pulse.materialize(pulse.SOURCE).source,
      items  = source;

  if (!items) return;

  if (_.method === 'greedy') {
    items = source = source.filter(hasBounds);
  }

  if (items.length >= 3 && hasOverlap(items)) {
    pulse = pulse.reflow(_.modified()).modifies('opacity');
    do {
      items = reduce(items);
    } while (items.length >= 3 && hasOverlap(items));

    if (items.length < 3 && !peek(source).opacity) {
      if (items.length > 1) peek(items).opacity = 0;
      peek(source).opacity = 1;
    }
  }

  return pulse;
};
