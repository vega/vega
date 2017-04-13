import {isObject} from 'vega-util';

var AxisRole = 'axis',
    LegendRole = 'legend',
    RowHeader = 'row-header',
    RowFooter = 'row-footer',
    ColHeader = 'column-header',
    ColFooter = 'column-footer';

function extractGroups(group) {
  var marks = [],
      groups = group.items,
      n = groups.length,
      i = 0, mark, items;

  var views = {
    marks: marks,
    rowheaders: [],
    rowfooters: [],
    colheaders: [],
    colfooters: []
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
        case RowHeader: views.rowheaders.push(items); break;
        case RowFooter: views.rowfooters.push(items); break;
        case ColHeader: views.colheaders.push(items); break;
        case ColFooter: views.colfooters.push(items); break;
        default: items.forEach(function(_) { marks.push(_); });
      }
    }
  }

  return views;
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

export function gridLayout(view, group, opt) {
  var views = extractGroups(group, opt),
      groups = views.marks,
      flush = opt.bounds === 'flush',
      bbox = flush ? bboxFlush : bboxFull,
      alignCol = isObject(opt.align) ? opt.align.column : opt.align,
      alignRow = isObject(opt.align) ? opt.align.row : opt.align,
      padCol = (isObject(opt.padding) ? opt.padding.column : opt.padding) || 0,
      padRow = (isObject(opt.padding) ? opt.padding.row : opt.padding) || 0,
      ncols = opt.columns || groups.length,
      nrows = ncols < 0 ? 1 : Math.ceil(groups.length / ncols),
      xOffset = [], xInit = 0,
      yOffset = [], yInit = 0,
      n = groups.length, m, i, j, offset;

  // determine offsets for each group
  for (i=0; i<n; ++i) {
    var b = bbox(groups[i]),
        px = i % ncols === 0 ? 0 : Math.ceil(bbox(groups[i-1]).x2),
        py = i < ncols ? 0 : Math.ceil(bbox(groups[i-ncols]).y2),
        x = (b.x1 < 0 ? Math.ceil(-b.x1) : 0) + px,
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

  // perform horizontal layout
  for (x=0, i=0; i<n; ++i) {
    px = groups[i].x || 0;
    groups[i].x = (x = xOffset[i] + (i % ncols ? x : 0));
    groups[i].bounds.translate(x - px, 0);
  }

  // perform vertical layout
  for (j=0; j<ncols; ++j) {
    for (y=0, i=j; i<n; i += ncols) {
      py = groups[i].y || 0;
      groups[i].y = (y += yOffset[i]);
      groups[i].bounds.translate(0, y - py);
    }
  }

  // ensure groups are re-rendered
  // TODO: add only when necessary
  view.enqueue(groups);

  // update mark bounds
  for (i=0; i<n; ++i) groups[i].mark.bounds.clear();
  for (i=0; i<n; ++i) groups[i].mark.bounds.union(groups[i].bounds);

  // grid headers
  var pad = (isObject(opt.padding) ? opt.padding.header : opt.padding) || 0;
  var bound = flush ? boundFlush : boundFull;
  function min(a, b) { return Math.floor(Math.min(a, b)); }
  function max(a, b) { return Math.ceil(Math.max(a, b)); }
  layoutHeaders(view, views.rowheaders, groups, ncols, -pad, min, 0, bound, 'x1', 0, ncols);
  layoutHeaders(view, views.rowfooters, groups, ncols, +pad, max, 0, bound, 'x2', ncols-1, ncols);
  layoutHeaders(view, views.colheaders, groups, ncols, -pad, min, 1, bound, 'y1', 0, 1);
  layoutHeaders(view, views.colfooters, groups, ncols, +pad, max, 1, bound, 'y2', n-ncols, 1);
}

function layoutHeaders(view, headers, groups, ncols, pad, agg, isX, bound, bf, start, stride) {
  if (!headers.length) return;

  var n = groups.length,
      m = headers.length,
      init = 0,
      i, j, k, b, h, px, py, x, y;

  // compute margin
  for (i=start; i<n; i+=stride) {
    init = agg(init, bound(groups[i], bf));
  }
  init += pad;

  // layout consecutive headers
  for (j=0; j<m; ++j) {
    h = headers[j];
    b = h[0].mark.bounds.clear();

    for (k=0, i=start; k<h.length; ++k, i+=stride) {
      px = h[k].x || 0;
      py = h[k].y || 0;
      if (isX) {
        h[k].x = x = groups[i].x;
        h[k].y = y = init;
      } else {
        h[k].x = x = init;
        h[k].y = y = groups[i].y;
      }
      b.union(h[k].bounds.translate(x - px, y - py));
    }

    view.enqueue(h);
    init = b[bf];
  }
}
