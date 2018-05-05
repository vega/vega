import {
  All, Each, Flush, Column, Row,
  Group, AxisRole, LegendRole,
  RowHeader, RowFooter, RowTitle,
  ColHeader, ColFooter, ColTitle
} from './constants';
import {isObject} from 'vega-util';
import {Bounds} from 'vega-scenegraph';

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
    if (mark.marktype === Group) {
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
  var b = item.bounds.clone();
  return b.empty()
    ? b.set(0, 0, 0, 0)
    : b.translate(-(item.x||0), -(item.y||0));
}

function boundFlush(item, field) {
  return field === 'x1' ? (item.x || 0)
    : field === 'y1' ? (item.y || 0)
    : field === 'x2' ? (item.x || 0) + (item.width || 0)
    : field === 'y2' ? (item.y || 0) + (item.height || 0)
    : undefined;
}

function boundFull(item, field) {
  return item.bounds[field];
}

function get(opt, key, d) {
  var v = isObject(opt) ? opt[key] : opt;
  return v != null ? v : (d !== undefined ? d : 0);
}

function offsetValue(v) {
  return v < 0 ? Math.ceil(-v) : 0;
}

export function gridLayout(view, group, opt) {
  var views = extractGroups(group, opt),
      groups = views.marks,
      flush = opt.bounds === Flush,
      bbox = flush ? bboxFlush : bboxFull,
      bounds = new Bounds(0, 0, 0, 0),
      alignCol = get(opt.align, Column),
      alignRow = get(opt.align, Row),
      padCol = get(opt.padding, Column),
      padRow = get(opt.padding, Row),
      off = opt.offset,
      ncols = group.columns || opt.columns || groups.length,
      nrows = ncols < 0 ? 1 : Math.ceil(groups.length / ncols),
      cells = nrows * ncols,
      xOffset = [], xExtent = [], xMax = 0, xInit = 0,
      yOffset = [], yExtent = [], yMax = 0, yInit = 0,
      n = groups.length,
      m, i, c, r, b, g, px, py, x, y, band, offset;

  for (i=0; i<ncols; ++i) {
    xExtent[i] = 0;
  }
  for (i=0; i<nrows; ++i) {
    yExtent[i] = 0;
  }

  // determine offsets for each group
  for (i=0; i<n; ++i) {
    b = bbox(groups[i]);
    c = i % ncols;
    r = ~~(i / ncols);
    px = Math.ceil(bbox(groups[i]).x2);
    py = Math.ceil(bbox(groups[i]).y2);
    xMax = Math.max(xMax, px);
    yMax = Math.max(yMax, py);
    xExtent[c] = Math.max(xExtent[c], px);
    yExtent[r] = Math.max(yExtent[r], py);
    xOffset.push(padCol + offsetValue(b.x1));
    yOffset.push(padRow + offsetValue(b.y1));
    view.dirty(groups[i]);
  }

  // set initial alignment offsets
  for (i=0; i<n; ++i) {
    if (i % ncols === 0) xOffset[i] = xInit;
    if (i < ncols) yOffset[i] = yInit;
  }

  // enforce column alignment constraints
  if (alignCol === Each) {
    for (c=1; c<ncols; ++c) {
      for (offset=0, i=c; i<n; i += ncols) {
        if (offset < xOffset[i]) offset = xOffset[i];
      }
      for (i=c; i<n; i += ncols) {
        xOffset[i] = offset + xExtent[c-1];
      }
    }
  } else if (alignCol === All) {
    for (offset=0, i=0; i<n; ++i) {
      if (i % ncols && offset < xOffset[i]) offset = xOffset[i];
    }
    for (i=0; i<n; ++i) {
      if (i % ncols) xOffset[i] = offset + xMax;
    }
  } else {
    for (alignCol=false, c=1; c<ncols; ++c) {
      for (i=c; i<n; i += ncols) {
        xOffset[i] += xExtent[c-1];
      }
    }
  }

  // enforce row alignment constraints
  if (alignRow === Each) {
    for (r=1; r<nrows; ++r) {
      for (offset=0, i=r*ncols, m=i+ncols; i<m; ++i) {
        if (offset < yOffset[i]) offset = yOffset[i];
      }
      for (i=r*ncols; i<m; ++i) {
        yOffset[i] = offset + yExtent[r-1];
      }
    }
  } else if (alignRow === All) {
    for (offset=0, i=ncols; i<n; ++i) {
      if (offset < yOffset[i]) offset = yOffset[i];
    }
    for (i=ncols; i<n; ++i) {
      yOffset[i] = offset + yMax;
    }
  } else {
    for (alignRow=false, r=1; r<nrows; ++r) {
      for (i=r*ncols, m=i+ncols; i<m; ++i) {
        yOffset[i] += yExtent[r-1];
      }
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
  for (c=0; c<ncols; ++c) {
    for (y=0, i=c; i<n; i += ncols) {
      g = groups[i];
      py = g.y || 0;
      g.y = (y += yOffset[i]);
      g.bounds.translate(0, y - py);
    }
  }

  // perform horizontal centering
  if (get(opt.center, Column) && nrows > 1 && alignCol) {
    for (i=0; i<n; ++i) {
      g = groups[i];
      b = alignCol === All ? xMax : xExtent[i % ncols];
      x = b - bbox(g).x2;
      if (x > 0) {
        g.x += (px = x / 2);
        g.bounds.translate(px, 0);
      }
    }
  }

  // perform vertical centering
  if (get(opt.center, Row) && ncols !== 1 && alignRow) {
    for (i=0; i<n; ++i) {
      g = groups[i];
      b = alignRow === All ? yMax : yExtent[~~(i / ncols)];
      y = b - bbox(g).y2;
      if (y > 0) {
        g.y += (py = y / 2);
        g.bounds.translate(0, py);
      }
    }
  }

  // update mark bounds, mark dirty
  for (i=0; i<n; ++i) groups[i].mark.bounds.clear();
  for (i=0; i<n; ++i) {
    g = groups[i];
    view.dirty(g);
    bounds.union(g.mark.bounds.union(g.bounds));
  }

  // -- layout grid headers and footers --

  // aggregation functions for grid margin determination
  function min(a, b) { return Math.floor(Math.min(a, b)); }
  function max(a, b) { return Math.ceil(Math.max(a, b)); }

  // bounding box calculation methods
  bbox = flush ? boundFlush : boundFull;

  // perform row header layout
  band = get(opt.headerBand, Row, null);
  x = layoutHeaders(view, views.rowheaders, groups, ncols, nrows, -get(off, 'rowHeader'),    min, 0, bbox, 'x1', 0, ncols, 1, band);

  // perform column header layout
  band = get(opt.headerBand, Column, null);
  y = layoutHeaders(view, views.colheaders, groups, ncols, ncols, -get(off, 'columnHeader'), min, 1, bbox, 'y1', 0, 1, ncols, band);

  // perform row footer layout
  band = get(opt.footerBand, Row, null);
  layoutHeaders(    view, views.rowfooters, groups, ncols, nrows,  get(off, 'rowFooter'),    max, 0, bbox, 'x2', ncols-1, ncols, 1, band);

  // perform column footer layout
  band = get(opt.footerBand, Column, null);
  layoutHeaders(    view, views.colfooters, groups, ncols, ncols,  get(off, 'columnFooter'), max, 1, bbox, 'y2', cells-ncols, 1, ncols, band);

  // perform row title layout
  if (views.rowtitle) {
    offset = x - get(off, 'rowTitle');
    band = get(opt.titleBand, Row, 0.5);
    layoutTitle(view, views.rowtitle, offset, 0, bounds, band);
  }

  // perform column title layout
  if (views.coltitle) {
    offset = y - get(off, 'columnTitle');
    band = get(opt.titleBand, Column, 0.5);
    layoutTitle(view, views.coltitle, offset, 1, bounds, band);
  }
}

function layoutHeaders(view, headers, groups, ncols, limit, offset, agg, isX, bound, bf, start, stride, back, band) {
  var n = groups.length,
      init = 0,
      edge = 0,
      i, j, k, m, b, h, g, x, y;

  // if no groups, early exit and return 0
  if (!n) return init;

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
    view.dirty(headers[j]);
    headers[j].mark.bounds.clear();
  }

  // layout each header
  for (i=start, j=0, m=headers.length; j<m; ++j, i+=stride) {
    h = headers[j];
    b = h.mark.bounds;

    // search for nearest group to align to
    // necessary if table has empty cells
    for (k=i; k >= 0 && (g = groups[k]) == null; k-=back);

    // assign coordinates and update bounds
    if (isX) {
      x = band == null ? g.x : Math.round(g.bounds.x1 + band * g.bounds.width());
      y = init;
    } else {
      x = init;
      y = band == null ? g.y : Math.round(g.bounds.y1 + band * g.bounds.height());
    }
    b.union(h.bounds.translate(x - (h.x || 0), y - (h.y || 0)));
    h.x = x;
    h.y = y;
    view.dirty(h);

    // update current edge of layout bounds
    edge = agg(edge, b[bf]);
  }

  return edge;
}

function layoutTitle(view, g, offset, isX, bounds, band) {
  if (!g) return;
  view.dirty(g);

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
  view.dirty(g);
}
