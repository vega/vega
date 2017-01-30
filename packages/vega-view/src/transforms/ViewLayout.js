import {Transform} from 'vega-dataflow';
import {Bounds, boundStroke} from 'vega-scenegraph';
import {inherits} from 'vega-util';

var Fit = 'fit',
    Pad = 'pad',
    None = 'none';

var AxisRole = 'axis',
    FrameRole = 'frame',
    LegendRole = 'legend',
    ScopeRole = 'scope';

/**
 * Layout view elements such as axes and legends.
 * Also performs size adjustments.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.mark - Scenegraph mark of groups to layout.
 */
export default function ViewLayout(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(ViewLayout, Transform);

prototype.transform = function(_, pulse) {
  // TODO incremental update, output?
  var view = pulse.dataflow;
  _.mark.items.forEach(function(group) {
    layoutGroup(view, group, _);
  });
  return pulse;
};

function layoutGroup(view, group, _) {
  var items = group.items,
      width = Math.max(0, group.width || 0),
      height = Math.max(0, group.height || 0),
      viewBounds = new Bounds().set(0, 0, width, height),
      axisBounds = viewBounds.clone(),
      legends = [],
      mark, flow, b, i, n;

  // layout axes, gather legends, collect bounds
  for (i=0, n=items.length; i<n; ++i) {
    mark = items[i];
    switch (mark.role) {
      case AxisRole:
        b = layoutAxis(view, mark, width, height);
        (isYAxis(mark) ? axisBounds : viewBounds).union(b);
        break;
      case LegendRole:
        legends.push(mark); break;
      case FrameRole:
      case ScopeRole:
        axisBounds.union(mark.bounds); break;
      default:
        viewBounds.union(mark.bounds);
    }
  }

  // layout legends, extending viewBounds
  if (legends.length) {
    flow = {left: 0, right: 0, margin: _.legendMargin || 8};

    for (i=0, n=legends.length; i<n; ++i) {
      b = layoutLegend(view, legends[i], flow, axisBounds, width, height);
      (_.autosize && _.autosize.type === Fit)
        ? viewBounds.add(b.x1, 0).add(b.x2, 0)
        : viewBounds.union(b);
    }
  }

  // perform size adjustment
  layoutSize(view, group, viewBounds.union(axisBounds), _);
}

function isYAxis(axisMark) {
  var orient = axisMark.items[0].datum.orient;
  return orient === 'left' || orient === 'right';
}

function axisIndices(datum) {
  var index = +datum.grid;
  return [
    datum.ticks  ? index++ : -1, // ticks index
    datum.labels ? index++ : -1, // labels index
    index + (+datum.domain)      // title index
  ];
}

function layoutAxis(view, axis, width, height) {
  var item = axis.items[0],
      datum = item.datum,
      orient = datum.orient,
      indices = axisIndices(datum),
      range = item.range,
      offset = item.offset,
      position = item.position,
      minExtent = item.minExtent,
      maxExtent = item.maxExtent,
      title = datum.title && item.items[indices[2]].items[0],
      titlePadding = item.titlePadding,
      titleSize = title ? title.fontSize + titlePadding : 0,
      bounds = item.bounds,
      x = 0, y = 0, i, s;

  bounds.clear();
  if ((i=indices[0]) > -1) bounds.union(item.items[i].bounds);
  if ((i=indices[1]) > -1) bounds.union(item.items[i].bounds);

  // position axis group and title
  switch (orient) {
    case 'top':
      x = position || 0;
      y = -offset;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.y1));
      if (title) title.auto
        ? (title.y = -(titlePadding + s), s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(0, -s).add(range, 0);
      break;
    case 'left':
      x = -offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.x1));
      if (title) title.auto
        ? (title.x = -(titlePadding + s), s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(-s, 0).add(0, range);
      break;
    case 'right':
      x = width + offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.x2));
      if (title) title.auto
        ? (title.x = titlePadding + s, s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(0, 0).add(s, range);
      break;
    case 'bottom':
      x = position || 0;
      y = height + offset;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.y2));
      if (title) title.auto
        ? (title.y = titlePadding + s, s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(0, 0).add(range, s);
      break;
    default:
      x = item.x;
      y = item.y;
  }

  if (set(item, 'x', x + 0.5) | set(item, 'y', y + 0.5)) {
    view.enqueue([item]);
  }

  // update bounds
  boundStroke(bounds.translate(x, y), item);
  item.mark.bounds.clear().union(bounds);
  return bounds;
}

function set(item, property, value) {
  return item[property] === value ? 0
    : (item[property] = value, 1);
}

function layoutLegend(view, legend, flow, axisBounds, width, height) {
  var item = legend.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds.clear(),
      x = 0,
      y = (flow[orient] || 0),
      w, h;

  // aggregate bounds to determine size
  // shave off 1 pixel because it looks better...
  item.items.forEach(function(_) { bounds.union(_.bounds); });
  w = Math.round(bounds.width()) + 2 * item.padding - 1;
  h = Math.round(bounds.height()) + 2 * item.padding - 1;

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
    default:
      x = item.x;
      y = item.y;
  }

  // update legend layout
  if (set(item, 'x', x) | set(item, 'width', w) |
      set(item, 'y', y) | set(item, 'height', h)) {
    view.enqueue([item]);
  }

  // update bounds
  boundStroke(bounds.set(x, y, x + w, y + h), item);
  item.mark.bounds.clear().union(bounds);
  return bounds;
}

function layoutSize(view, group, viewBounds, _) {
  var type = _.autosize && _.autosize.type,
      auto = _.autosize && _.autosize.resize,
      viewWidth = view._width,
      viewHeight = view._height;

  if (view._autosize < 1 || !type) return;

  var width  = Math.max(0, group.width || 0),
      left   = Math.max(0, Math.ceil(-viewBounds.x1)),
      right  = Math.max(0, Math.ceil(viewBounds.x2 - width)),
      height = Math.max(0, group.height || 0),
      top    = Math.max(0, Math.ceil(-viewBounds.y1)),
      bottom = Math.max(0, Math.ceil(viewBounds.y2 - height));

  if (type === None) {
    viewWidth = width;
    viewHeight = height;
    left = 0;
    top = 0;
  }

  else if (type === Fit) {
    width = Math.max(0, viewWidth - left - right);
    height = Math.max(0, viewHeight - top - bottom);
  }

  else if (type === Pad) {
    viewWidth = width + left + right;
    viewHeight = height + top + bottom;
  }

  view.autosize(viewWidth, viewHeight, width, height, [left, top], auto);
}
