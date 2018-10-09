import {
  Group, AxisRole, LegendRole, TitleRole, FrameRole, ScopeRole,
  RowHeader, RowFooter, RowTitle, ColHeader, ColFooter, ColTitle,
  Top, Bottom, Left, Right, Start, End,
  TopLeft, TopRight, BottomLeft, BottomRight,
  Fit, FitX, FitY, Pad, None, Padding, Symbols
} from './constants';
import {gridLayout} from './gridLayout';
import {Transform} from 'vega-dataflow';
import {Bounds, boundStroke} from 'vega-scenegraph';
import {inherits} from 'vega-util';

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
  if (_.modified()) pulse.reflow();
  return pulse;
};

function layoutGroup(view, group, _) {
  var items = group.items,
      width = Math.max(0, group.width || 0),
      height = Math.max(0, group.height || 0),
      viewBounds = new Bounds().set(0, 0, width, height),
      xBounds = viewBounds.clone(),
      yBounds = viewBounds.clone(),
      legends = [], title,
      mark, flow, b, i, n;

  // layout axes, gather legends, collect bounds
  for (i=0, n=items.length; i<n; ++i) {
    mark = items[i];
    switch (mark.role) {
      case AxisRole:
        b = isYAxis(mark) ? xBounds : yBounds;
        b.union(axisLayout(view, mark, width, height));
        break;
      case TitleRole:
        title = mark; break;
      case LegendRole:
        legends.push(mark); break;
      case FrameRole:
      case ScopeRole:
      case RowHeader:
      case RowFooter:
      case RowTitle:
      case ColHeader:
      case ColFooter:
      case ColTitle:
        xBounds.union(mark.bounds);
        yBounds.union(mark.bounds);
        break;
      default:
        viewBounds.union(mark.bounds);
    }
  }

  // layout legends, adjust viewBounds
  if (legends.length) {
    flow = {
      leftWidth: legendPreprocess(view, legends),
      margin: _.legendMargin || 8,
      left: 0, right: 0, top: 0, bottom: 0
    };

    for (i=0, n=legends.length; i<n; ++i) {
      b = legendLayout(view, legends[i], flow, xBounds, yBounds, width, height);
      if (_.autosize && _.autosize.type === Fit) {
        // For autosize fit, incorporate the orthogonal dimension only.
        // Legends that overrun the chart area will then be clipped;
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

  // combine bounding boxes
  viewBounds.union(xBounds).union(yBounds);

  // layout title, adjust bounds
  if (title) {
    viewBounds.union(titleLayout(view, title, width, height, viewBounds));
  }

  // perform size adjustment
  viewSizeLayout(view, group, viewBounds, _);
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

function axisLayout(view, axis, width, height) {
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
      if (title) s = axisTitleLayout(title, s, titlePadding, 0, -1, bounds);
      bounds.add(0, -s).add(range, 0);
      break;
    case Left:
      x = -offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.x1));
      if (title) s = axisTitleLayout(title, s, titlePadding, 1, -1, bounds);
      bounds.add(-s, 0).add(0, range);
      break;
    case Right:
      x = width + offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.x2));
      if (title) s = axisTitleLayout(title, s, titlePadding, 1, 1, bounds);
      bounds.add(0, 0).add(s, range);
      break;
    case Bottom:
      x = position || 0;
      y = height + offset;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.y2));
      if (title) s = axisTitleLayout(title, s, titlePadding, 0, 1, bounds);
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

function axisTitleLayout(title, offset, pad, isYAxis, sign, bounds) {
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

function titleLayout(view, title, width, height, viewBounds) {
  var item = title.items[0],
      orient = item.orient,
      frame = item.frame,
      anchor = item.anchor,
      offset = item.offset,
      bounds = item.bounds,
      vertical = (orient === Left || orient === Right),
      start = 0,
      end = vertical ? height : width,
      x = 0, y = 0, pos;

  if (frame !== Group) {
    orient === Left ? (start = viewBounds.y2, end = viewBounds.y1)
      : orient === Right ? (start = viewBounds.y1, end = viewBounds.y2)
      : (start = viewBounds.x1, end = viewBounds.x2);
  } else if (orient === Left) {
    start = height, end = 0;
  }

  pos = (anchor === Start) ? start
    : (anchor === End) ? end
    : (start + end) / 2;

  tempBounds.clear().union(bounds);

  // position title text
  switch (orient) {
    case Top:
      x = pos;
      y = viewBounds.y1 - offset;
      break;
    case Left:
      x = viewBounds.x1 - offset;
      y = pos;
      break;
    case Right:
      x = viewBounds.x2 + offset;
      y = pos;
      break;
    case Bottom:
      x = pos;
      y = viewBounds.y2 + offset;
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

function legendPreprocess(view, legends) {
  return legends.reduce(function(w, legend) {
    var item = legend.items[0];

    // adjust entry to accommodate padding and title
    legendGroupLayout(view, item, item.items[0].items[0]);

    if (item.datum.orient === Left) {
      var b = tempBounds.clear();
      item.items.forEach(function(_) { b.union(_.bounds); });
      w = Math.max(w, Math.ceil(b.width() + 2 * item.padding - 1));
    }

    return w;
  }, 0);
}

function legendGroupLayout(view, item, entry) {
  var x = item.padding - entry.x,
      y = item.padding - entry.y;

  if (item.datum.title) {
    var title = item.items[1].items[0];
    y += item.titlePadding + title.fontSize;
  }

  if (x || y) {
    entry.x += x;
    entry.y += y;
    entry.bounds.translate(x, y);
    entry.mark.bounds.translate(x, y);
    view.dirty(entry);
  }
}

function legendLayout(view, legend, flow, xBounds, yBounds, width, height) {
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
  w = 2 * item.padding - 1;
  h = 2 * item.padding - 1;
  if (!bounds.empty()) {
    w = Math.ceil(bounds.width() + w);
    h = Math.ceil(bounds.height() + h);
  }

  if (datum.type === Symbols) {
    legendEntryLayout(item.items[0].items[0].items[0].items);
  }

  switch (orient) {
    case Left:
      x -= flow.leftWidth + offset - Math.floor(axisBounds.x1);
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
    case TopLeft:
      x += offset;
      y += offset;
      break;
    case TopRight:
      x += width - w - offset;
      y += offset;
      break;
    case BottomLeft:
      x += offset;
      y += height - h - offset;
      break;
    case BottomRight:
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

function legendEntryLayout(entries) {
  // get max widths for each column
  var widths = entries.reduce(function(w, g) {
    w[g.column] = Math.max(g.bounds.x2 - g.x, w[g.column] || 0);
    return w;
  }, {});

  // set dimensions of legend entry groups
  entries.forEach(function(g) {
    g.width  = widths[g.column];
    g.height = g.bounds.y2 - g.y;
  });
}

function viewSizeLayout(view, group, viewBounds, _) {
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
