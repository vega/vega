import {Transform} from 'vega-dataflow';
import {Bounds} from 'vega-scenegraph';
import {inherits} from 'vega-util';

// var GRIDS = 0,
var TICKS = 0,
    LABEL = 1,
    TITLE = 2;

var tempBounds = new Bounds();

/**
 * Layout chart elements such as axes and legends.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.mark - Scenegraph mark of chart groups to layout.
 */
export default function ChartLayout(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(ChartLayout, Transform);

prototype.transform = function(_, pulse) {
  // TODO incremental update, output
  _.mark.items.forEach(layoutGroup);
  return pulse;
};

function layoutGroup(group) {
  var items = group.items,
      width = group.width,
      height = group.height,
      bounds = new Bounds(0, 0, width, height),
      axisMarks = [],
      legendMarks = [],
      mark, i, n;

  // collect axes and legends, compute bounds
  for (i=0, n=items.length; i<n; ++i) {
    mark = items[i];
    if (mark.role === 'axis') axisMarks.push(mark);
    else if (mark.role === 'legend') legendMarks.push(mark);
  }

  // layout axes
  for (i=0, n=axisMarks.length; i<n; ++i) {
    bounds.union(layoutAxis(axisMarks[i], width, height));
  }

  // TODO layout legends
  // for (i=0, n=legendMarks.length; i<n; ++i) {
  //   layoutLegend(legendMarks[i], width, height);
  // }

  // TODO automatic size adjustment
}

function layoutAxis(axis, width, height) {
  var item = axis.items[0],
      orient = item.datum.orient || 'left',
      offset = item.offset,
      minExtent = item.minExtent,
      maxExtent = item.maxExtent,
      title = item.items[TITLE] && item.items[TITLE].items[0],
      titlePadding = item.titlePadding,
      titleSize = title ? (title.fontSize || 14) + titlePadding : 0,
      bounds = tempBounds,
      x, y, s;

  bounds.clear()
    .union(item.items[TICKS].bounds)
    .union(item.items[LABEL].bounds);

  // position axis group and title
  // TODO: ignore title positioning if user-specified
  switch (orient) {
    case 'top': {
      x = 0;
      y = -offset;
      s = Math.max(minExtent, Math.min(maxExtent, offset - bounds.y1));
      if (title) {
        title.y = -(titlePadding + s);
        s += titleSize;
      }
      bounds.set(0, -s, width, 0);
      break;
    }
    case 'left': {
      x = -offset;
      y = 0;
      s = Math.max(minExtent, Math.min(maxExtent, offset - bounds.x1));
      if (title) {
        title.x = -(titlePadding + s);
        s += titleSize;
      }
      bounds.set(-s, 0, 0, height);
      break;
    }
    case 'right': {
      y = 0;
      x = offset + width;
      s = Math.max(minExtent, Math.min(maxExtent, offset + bounds.x2));
      if (title) {
        title.x = titlePadding + s;
        s += titleSize;
      }
      bounds.set(width, 0, width + s, height);
      break;
    }
    case 'bottom': {
      x = 0;
      y = offset + height;
      s = Math.max(minExtent, Math.min(maxExtent, offset + bounds.y2));
      if (title) {
        title.y = titlePadding + s;
        s += titleSize;
      }
      bounds.set(0, height, width, height + s);
      break;
    }
  }
  item.x = x;
  item.y = y;

  return bounds;
}

// TODO legend layout
// function layoutLegend(legend, width, height) {
// }
