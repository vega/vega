import {isObject} from 'vega-util';
import {Bounds} from 'vega-scenegraph';

var AxisRole = 'axis',
    LegendRole = 'legend',
    RowHeader = 'row-header',
    RowFooter = 'row-footer',
    RowTitle  = 'row-title',
    ColHeader = 'column-header',
    ColFooter = 'column-footer',
    ColTitle  = 'column-title';

function extractGroups(group) {
  var groups = group.items,
      n = groups.length,
      i = 0, mark, items;

  var views = {
    marks:      [],
    rowheaders: [],
    rowfooters: [],
    colheaders: [],
    colfooters: [],
    rowtitle: null,
    coltitle: null
  };

  // layout axes, gather legends, collect bounds
  for (; i<n; ++i) {
    mark = groups[i];
    items = mark.items;
    if (mark.marktype === 'group') {
      switch (mark.role) {
        case AxisRole:
        case LegendRole:
          break;
        case RowHeader: addAll(items, views.rowheaders); break;
        case RowFooter: addAll(items, views.rowfooters); break;
        case ColHeader: addAll(items, views.colheaders); break;
        case ColFooter: addAll(items, views.colfooters); break;
        case RowTitle:  views.rowtitle = items[0]; break;
        case ColTitle:  views.coltitle = items[0]; break;
        default:        addAll(items, views.marks);
      }
    }
  }

  return views;
}

function addAll(items, array) {
  for (var i=0, n=items.length; i<n; ++i) {
    array.push(items[i]);
  }
}

function bboxFlush(item) {
  return {x1: 0, y1: 0, x2: item.width || 0, y2: item.height || 0};
}

function bboxFull(item) {
  return item.bounds.clone().translate(-(item.x||0), -(item.y||0));
}

function boundFlush(item, field) {
  var b = {x1: item.x, y1: item.y, x2: item.x + item.width, y2: item.y + item.height};
  return b[field];
}

function boundFull(item, field) {
  return item.bounds[field];
}

function get(opt, key, d) {
  return (isObject(opt) ? opt[key] : opt) || d || 0;
}

export function gridLayout(view, group, opt) {
  var views = extractGroups(group, opt),
      groups = views.marks,
      flush = opt.bounds === 'flush',
      bbox = flush ? bboxFlush : bboxFull,
      bounds = new Bounds(0, 0, 0, 0),
      alignCol = get(opt.align, 'column'),
      alignRow = get(opt.align, 'row'),
      padCol = get(opt.padding, 'column'),
      padRow = get(opt.padding, 'row'),
      off = opt.offset,
      ncols = opt.columns || groups.length,
      nrows = ncols < 0 ? 1 : Math.ceil(groups.length / ncols),
      cells = nrows * ncols,
      xOffset = [], xInit = 0,
      yOffset = [], yInit = 0,
      n = groups.length,
      m, i, j, b, g, px, py, x, y, band, offset;

  // determine offsets for each group
  for (i=0; i<n; ++i) {
    b = bbox(groups[i]);
    px = i % ncols === 0 ? 0 : Math.ceil(bbox(groups[i-1]).x2);
    py = i < ncols ? 0 : Math.ceil(bbox(groups[i-ncols]).y2);
    x = (b.x1 < 0 ? Math.ceil(-b.x1) : 0) + px;
    y = (b.y1 < 0 ? Math.ceil(-b.y1) : 0) + py;
    xOffset.push(x + padCol);
    yOffset.push(y + padRow);
  }

  // set initial alignment offsets
  for (i=0; i<n; ++i) {
    if (i % ncols === 0) xOffset[i] = xInit;
    if (i < ncols) yOffset[i] = yInit;
  }

  // enforce column alignment constraints
  if (alignCol === 'each') {
    for (j=1; j<ncols; ++j) {
      for (offset=0, i=j; i<n; i += ncols) {
        if (offset < xOffset[i]) offset = xOffset[i];
      }
      for (i=j; i<n; i += ncols) {
        xOffset[i] = offset;
      }
    }
  } else if (alignCol === 'all') {
    for (offset=0, i=0; i<n; ++i) {
      if (i % ncols && offset < xOffset[i]) offset = xOffset[i];
    }
    for (i=0; i<n; ++i) {
      if (i % ncols) xOffset[i] = offset;
    }
  }

  // enforce row alignment constraints
  if (alignRow === 'each') {
    for (j=1; j<nrows; ++j) {
      for (offset=0, i=j*ncols, m=i+ncols; i<m; ++i) {
        if (offset < yOffset[i]) offset = yOffset[i];
      }
      for (i=j*ncols; i<m; ++i) {
        yOffset[i] = offset;
      }
    }
  } else if (alignRow === 'all') {
    for (offset=0, i=ncols; i<n; ++i) {
      if (offset < yOffset[i]) offset = yOffset[i];
    }
    for (i=ncols; i<n; ++i) {
      yOffset[i] = offset;
    }
  }

  // perform horizontal grid layout
  for (x=0, i=0; i<n; ++i) {
    g = groups[i];
    px = g.x || 0;
    g.x = (x = xOffset[i] + (i % ncols ? x : 0));
    g.bounds.translate(x - px, 0);
  }

  // perform vertical grid layout
  for (j=0; j<ncols; ++j) {
    for (y=0, i=j; i<n; i += ncols) {
      g = groups[i];
      py = g.y || 0;
      g.y = (y += yOffset[i]);
      g.bounds.translate(0, y - py);
    }
  }

  // queue groups for redraw
  view.enqueue(groups);

  // update mark bounds
  for (i=0; i<n; ++i) groups[i].mark.bounds.clear();
  for (i=0; i<n; ++i) {
    g = groups[i];
    bounds.union(g.mark.bounds.union(g.bounds));
  }

  // -- layout grid headers and footers --

  // aggregation functions for grid margin determination
  function min(a, b) { return Math.floor(Math.min(a, b)); }
  function max(a, b) { return Math.ceil(Math.max(a, b)); }

  // bounding box calculation methods
  bbox = flush ? boundFlush : boundFull;

  // perform header layout
  x = layoutHeaders(view, views.rowheaders, groups, ncols, nrows, -get(off, 'rowHeader'),    min, 0, bbox, 'x1', 0, ncols, 1);
  y = layoutHeaders(view, views.colheaders, groups, ncols, ncols, -get(off, 'columnHeader'), min, 1, bbox, 'y1', 0, 1, ncols);

  // perform footer layout
  layoutHeaders(    view, views.rowfooters, groups, ncols, nrows,  get(off, 'rowFooter'),    max, 0, bbox, 'x2', ncols-1, ncols, 1);
  layoutHeaders(    view, views.colfooters, groups, ncols, ncols,  get(off, 'columnFooter'), max, 1, bbox, 'y2', cells-ncols, 1, ncols);

  // perform row title layout
  if (views.rowtitle) {
    offset = x - get(off, 'rowTitle');
    band = get(opt.titleBand, 'row', 0.5);
    layoutTitle(view, views.rowtitle, offset, 0, bounds, band);
  }

  // perform column title layout
  if (views.coltitle) {
    offset = y - get(off, 'columnTitle');
    band = get(opt.titleBand, 'column', 0.5);
    layoutTitle(view, views.coltitle, offset, 1, bounds, band);
  }
}

function layoutHeaders(view, headers, groups, ncols, limit, offset, agg, isX, bound, bf, start, stride, back) {
  var n = groups.length,
      init = 0,
      edge = 0,
      i, j, k, m, b, h, g, x, y;

  // compute margin
  for (i=start; i<n; i+=stride) {
    if (groups[i]) init = agg(init, bound(groups[i], bf));
  }

  // if no headers, return margin calculation
  if (!headers.length) return init;

  // check if number of headers exceeds number of rows or columns
  if (headers.length > limit) {
    view.warn('Grid headers exceed limit: ' + limit);
    headers = headers.slice(0, limit);
  }

  // apply offset
  init += offset;

  // clear mark bounds for all headers
  for (j=0, m=headers.length; j<m; ++j) {
    headers[j].mark.bounds.clear();
  }

  // layout each header
  for (i=start, j=0, m=headers.length; j<m; ++j, i+=stride) {
    h = headers[j];
    b = h.mark.bounds;

    // search for nearest group to align to
    // necessary if table has empty cells
    for (k=i; (g = groups[k]) == null; k-=back);

    // assign coordinates and update bounds
    isX ? (x = g.x, y = init) : (x = init, y = g.y);
    b.union(h.bounds.translate(x - (h.x || 0), y - (h.y || 0)));
    h.x = x;
    h.y = y;

    // update current edge of layout bounds
    edge = agg(edge, b[bf]);
  }

  // queue headers for redraw
  view.enqueue(headers);
  return edge;
}

function layoutTitle(view, g, offset, isX, bounds, band) {
  if (!g) return;

  // compute title coordinates
  var x = offset, y = offset;
  isX
    ? (x = Math.round(bounds.x1 + band * bounds.width()))
    : (y = Math.round(bounds.y1 + band * bounds.height()));

  // assign coordinates and update bounds
  g.bounds.translate(x - (g.x || 0), y - (g.y || 0));
  g.mark.bounds.clear().union(g.bounds);
  g.x = x;
  g.y = y;

  // queue title for redraw
  view.enqueue(g.mark.items);
}
