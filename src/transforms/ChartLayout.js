import {Transform} from 'vega-dataflow';
import {Bounds} from 'vega-scenegraph';
import {inherits} from 'vega-util';

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
  _.mark.items.forEach(function(group) {
    layoutGroup(group, _);
  });
  return pulse;
};

function layoutGroup(group, _) {
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

  // layout legends
  var flow = {
    left:   0,
    right:  0,
    margin: _.legendMargin || 8
  };
  for (i=0, n=legendMarks.length; i<n; ++i) {
    layoutLegend(legendMarks[i], flow, bounds, width, height);
  }

  // TODO automatic size adjustment
}

function layoutAxis(axis, width, height) {
  var item = axis.items[0],
      datum = item.datum,
      orient = datum.orient,
      ticksIndex = datum.grid ? 1 : 0,
      labelIndex = ticksIndex + 1,
      titleIndex = labelIndex + (datum.domain ? 2 : 1),
      offset = item.offset,
      minExtent = item.minExtent,
      maxExtent = item.maxExtent,
      title = datum.title && item.items[titleIndex].items[0],
      titlePadding = item.titlePadding,
      titleSize = title ? title.fontSize + titlePadding : 0,
      bounds = tempBounds,
      x, y, s;

  bounds.clear()
    .union(item.items[ticksIndex].bounds)
    .union(item.items[labelIndex].bounds);

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

function layoutLegend(legend, flow, axisBounds, width, height) {
  var item = legend.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds.clear(),
      x = 0.5,
      y = 0.5 + (flow[orient] || 0),
      w, h;

  item.items.forEach(function(_) { bounds.union(_.bounds); });
  w = Math.ceil(bounds.width()) + item.padding * 2;
  h = Math.ceil(bounds.height()) + item.padding * 2;

  switch (orient) {
    case 'left':
      x -= w + offset - Math.floor(axisBounds.x1);
      flow.left += h + flow.margin;
      break;
    case 'right':
      x += offset + Math.ceil(axisBounds.x2);
      flow.right += h + flow.margin;
      break;
    case 'top-left':
      x += offset;
      y += offset;
      break;
    case 'top-right':
      x += width - w - offset;
      y += offset;
      break;
    case 'bottom-left':
      x += offset;
      y += height - h - offset;
      break;
    case 'bottom-right':
      x += width - w - offset;
      y += height - h - offset;
      break;
  }

  // update legend layout
  item.x = x;
  item.y = y;
  item.width = w;
  item.height = h;

  // update bounds
  bounds.set(x, y, x + w, y + h);
  item.mark.bounds.clear().union(bounds);
}
