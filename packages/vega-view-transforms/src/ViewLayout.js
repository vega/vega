import {gridLayout} from './gridLayout';
import {Top, Bottom, Left, Right} from './orient';
import {Transform} from 'vega-dataflow';
import {Bounds, boundStroke} from 'vega-scenegraph';
import {inherits} from 'vega-util';

var Fit = 'fit',
    FitX = 'fit-x',
    FitY = 'fit-y',
    Pad = 'pad',
    None = 'none',
    Padding = 'padding';

var AxisRole = 'axis',
    TitleRole = 'title',
    FrameRole = 'frame',
    LegendRole = 'legend',
    ScopeRole = 'scope',
    RowHeader = 'row-header',
    RowFooter = 'row-footer',
    ColHeader = 'column-header',
    ColFooter = 'column-footer';

var AxisOffset = 0.5,
    tempBounds = new Bounds();

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
    if (_.layout) gridLayout(view, group, _.layout);
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
      xBounds = viewBounds.clone(),
      yBounds = viewBounds.clone(),
      legends = [], title,
      mark, flow, b, i, n;

  // layout axes, gather legends, collect bounds
  for (i=0, n=items.length; i<n; ++i) {
    mark = items[i];
    switch (mark.role) {
      case AxisRole:
        axisBounds.union(b = layoutAxis(view, mark, width, height));
        (isYAxis(mark) ? xBounds : yBounds).union(b);
        break;
      case TitleRole:
        title = mark; break;
      case LegendRole:
        legends.push(mark); break;
      case FrameRole:
      case ScopeRole:
      case RowHeader:
      case RowFooter:
      case ColHeader:
      case ColFooter:
        xBounds.union(mark.bounds);
        yBounds.union(mark.bounds);
        break;
      default:
        viewBounds.union(mark.bounds);
    }
  }

  // layout title, adjust bounds
  if (title) {
    axisBounds.union(b = layoutTitle(view, title, axisBounds));
    (isYAxis(title) ? xBounds : yBounds).union(b);
  }

  // layout legends, adjust viewBounds
  if (legends.length) {
    flow = {left: 0, right: 0, top: 0, bottom: 0, margin: _.legendMargin || 8};

    for (i=0, n=legends.length; i<n; ++i) {
      b = layoutLegend(view, legends[i], flow, xBounds, yBounds, width, height);
      if (_.autosize && _.autosize.type === Fit) {
        // for autosize fit, incorporate the orthogonal dimension only
        // legends that overrun the chart area will then be clipped
        // otherwise the chart area gets reduced to nothing!
        var orient = legends[i].items[0].datum.orient;
        if (orient === Left || orient === Right) {
          viewBounds.add(b.x1, 0).add(b.x2, 0);
        } else if (orient === Top || orient === Bottom) {
          viewBounds.add(0, b.y1).add(0, b.y2);
        }
      } else {
        viewBounds.union(b);
      }
    }
  }

  // perform size adjustment
  viewBounds.union(xBounds).union(yBounds).union(axisBounds);
  layoutSize(view, group, viewBounds, _);
}

function set(item, property, value) {
  if (item[property] === value) {
    return 0;
  } else {
    item[property] = value;
    return 1;
  }
}

function isYAxis(mark) {
  var orient = mark.items[0].datum.orient;
  return orient === Left || orient === Right;
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
      bounds = item.bounds,
      x = 0, y = 0, i, s;

  tempBounds.clear().union(bounds);
  bounds.clear();
  if ((i=indices[0]) > -1) bounds.union(item.items[i].bounds);
  if ((i=indices[1]) > -1) bounds.union(item.items[i].bounds);

  // position axis group and title
  switch (orient) {
    case Top:
      x = position || 0;
      y = -offset;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.y1));
      if (title) s = layoutAxisTitle(title, s, titlePadding, 0, -1, bounds);
      bounds.add(0, -s).add(range, 0);
      break;
    case Left:
      x = -offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.x1));
      if (title) s = layoutAxisTitle(title, s, titlePadding, 1, -1, bounds);
      bounds.add(-s, 0).add(0, range);
      break;
    case Right:
      x = width + offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.x2));
      if (title) s = layoutAxisTitle(title, s, titlePadding, 1, 1, bounds);
      bounds.add(0, 0).add(s, range);
      break;
    case Bottom:
      x = position || 0;
      y = height + offset;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.y2));
      if (title) s = layoutAxisTitle(title, s, titlePadding, 0, 1, bounds);
      bounds.add(0, 0).add(range, s);
      break;
    default:
      x = item.x;
      y = item.y;
  }

  // update bounds
  boundStroke(bounds.translate(x, y), item);

  if (set(item, 'x', x + AxisOffset) | set(item, 'y', y + AxisOffset)) {
    item.bounds = tempBounds;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }

  return item.mark.bounds.clear().union(bounds);
}

function layoutAxisTitle(title, offset, pad, isYAxis, sign, bounds) {
  var b = title.bounds, dx = 0, dy = 0;

  if (title.auto) {
    offset += pad;

    isYAxis
      ? dx = (title.x || 0) - (title.x = sign * offset)
      : dy = (title.y || 0) - (title.y = sign * offset);

    b.translate(-dx, -dy);
    title.mark.bounds.set(b.x1, b.y1, b.x2, b.y2);

    if (isYAxis) {
      bounds.add(0, b.y1).add(0, b.y2);
      offset += b.width();
    } else {
      bounds.add(b.x1, 0).add(b.x2, 0);
      offset += b.height();
    }
  } else {
    bounds.union(b);
  }

  return offset;
}

function layoutTitle(view, title, axisBounds) {
  var item = title.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds,
      x = 0, y = 0;

  tempBounds.clear().union(bounds);

  // position axis group and title
  switch (orient) {
    case Top:
      x = item.x;
      y = axisBounds.y1 - offset;
      break;
    case Left:
      x = axisBounds.x1 - offset;
      y = item.y;
      break;
    case Right:
      x = axisBounds.x2 + offset;
      y = item.y;
      break;
    case Bottom:
      x = item.x;
      y = axisBounds.y2 + offset;
      break;
    default:
      x = item.x;
      y = item.y;
  }

  bounds.translate(x - item.x, y - item.y);
  if (set(item, 'x', x) | set(item, 'y', y)) {
    item.bounds = tempBounds;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }

  // update bounds
  return title.bounds.clear().union(bounds);
}

function layoutLegend(view, legend, flow, xBounds, yBounds, width, height) {
  var item = legend.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds,
      x = 0,
      y = 0,
      w, h, axisBounds;

  if (orient === Top || orient === Bottom) {
    axisBounds = yBounds,
    x = flow[orient];
  } else if (orient === Left || orient === Right) {
    axisBounds = xBounds;
    y = flow[orient];
  }

  tempBounds.clear().union(bounds);
  bounds.clear();

  // aggregate bounds to determine size
  // shave off 1 pixel because it looks better...
  item.items.forEach(function(_) { bounds.union(_.bounds); });
  w = Math.round(bounds.width()) + 2 * item.padding - 1;
  h = Math.round(bounds.height()) + 2 * item.padding - 1;

  switch (orient) {
    case Left:
      x -= w + offset - Math.floor(axisBounds.x1);
      flow.left += h + flow.margin;
      break;
    case Right:
      x += offset + Math.ceil(axisBounds.x2);
      flow.right += h + flow.margin;
      break;
    case Top:
      y -= h + offset - Math.floor(axisBounds.y1);
      flow.top += w + flow.margin;
      break;
    case Bottom:
      y += offset + Math.ceil(axisBounds.y2);
      flow.bottom += w + flow.margin;
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

  // update bounds
  boundStroke(bounds.set(x, y, x + w, y + h), item);

  // update legend layout
  if (set(item, 'x', x) | set(item, 'width', w) |
      set(item, 'y', y) | set(item, 'height', h)) {
    item.bounds = tempBounds;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }

  return item.mark.bounds.clear().union(bounds);
}

function layoutSize(view, group, viewBounds, _) {
  var auto = _.autosize || {},
      type = auto.type,
      viewWidth = view._width,
      viewHeight = view._height,
      padding = view.padding();

  if (view._autosize < 1 || !type) return;

  var width  = Math.max(0, group.width || 0),
      left   = Math.max(0, Math.ceil(-viewBounds.x1)),
      right  = Math.max(0, Math.ceil(viewBounds.x2 - width)),
      height = Math.max(0, group.height || 0),
      top    = Math.max(0, Math.ceil(-viewBounds.y1)),
      bottom = Math.max(0, Math.ceil(viewBounds.y2 - height));

  if (auto.contains === Padding) {
    viewWidth -= padding.left + padding.right;
    viewHeight -= padding.top + padding.bottom;
  }

  if (type === None) {
    left = 0;
    top = 0;
    width = viewWidth;
    height = viewHeight;
  }

  else if (type === Fit) {
    width = Math.max(0, viewWidth - left - right);
    height = Math.max(0, viewHeight - top - bottom);
  }

  else if (type === FitX) {
    width = Math.max(0, viewWidth - left - right);
    viewHeight = height + top + bottom;
  }

  else if (type === FitY) {
    viewWidth = width + left + right;
    height = Math.max(0, viewHeight - top - bottom);
  }

  else if (type === Pad) {
    viewWidth = width + left + right;
    viewHeight = height + top + bottom;
  }

  view._resizeView(
    viewWidth, viewHeight,
    width, height,
    [left, top],
    auto.resize
  );
}
