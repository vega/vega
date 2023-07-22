(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-dataflow'), require('vega-scenegraph'), require('vega-util')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-dataflow', 'vega-scenegraph', 'vega-util'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.vega = global.vega || {}, global.vega.transforms = {}), global.vega, global.vega, global.vega));
})(this, (function (exports, vegaDataflow, vegaScenegraph, vegaUtil) { 'use strict';

  const Top = 'top';
  const Left = 'left';
  const Right = 'right';
  const Bottom = 'bottom';
  const TopLeft = 'top-left';
  const TopRight = 'top-right';
  const BottomLeft = 'bottom-left';
  const BottomRight = 'bottom-right';
  const Start = 'start';
  const Middle = 'middle';
  const End = 'end';
  const X = 'x';
  const Y = 'y';
  const Group = 'group';
  const AxisRole = 'axis';
  const TitleRole = 'title';
  const FrameRole = 'frame';
  const ScopeRole = 'scope';
  const LegendRole = 'legend';
  const RowHeader = 'row-header';
  const RowFooter = 'row-footer';
  const RowTitle = 'row-title';
  const ColHeader = 'column-header';
  const ColFooter = 'column-footer';
  const ColTitle = 'column-title';
  const Padding = 'padding';
  const Symbols = 'symbol';
  const Fit = 'fit';
  const FitX = 'fit-x';
  const FitY = 'fit-y';
  const Pad = 'pad';
  const None = 'none';
  const All = 'all';
  const Each = 'each';
  const Flush = 'flush';
  const Column = 'column';
  const Row = 'row';

  /**
   * Calculate bounding boxes for scenegraph items.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {object} params.mark - The scenegraph mark instance to bound.
   */
  function Bound(params) {
    vegaDataflow.Transform.call(this, null, params);
  }
  vegaUtil.inherits(Bound, vegaDataflow.Transform, {
    transform(_, pulse) {
      const view = pulse.dataflow,
        mark = _.mark,
        type = mark.marktype,
        entry = vegaScenegraph.Marks[type],
        bound = entry.bound;
      let markBounds = mark.bounds,
        rebound;
      if (entry.nested) {
        // multi-item marks have a single bounds instance
        if (mark.items.length) view.dirty(mark.items[0]);
        markBounds = boundItem(mark, bound);
        mark.items.forEach(item => {
          item.bounds.clear().union(markBounds);
        });
      } else if (type === Group || _.modified()) {
        // operator parameters modified -> re-bound all items
        // updates group bounds in response to modified group content
        pulse.visit(pulse.MOD, item => view.dirty(item));
        markBounds.clear();
        mark.items.forEach(item => markBounds.union(boundItem(item, bound)));

        // force reflow for axes/legends/titles to propagate any layout changes
        switch (mark.role) {
          case AxisRole:
          case LegendRole:
          case TitleRole:
            pulse.reflow();
        }
      } else {
        // incrementally update bounds, re-bound mark as needed
        rebound = pulse.changed(pulse.REM);
        pulse.visit(pulse.ADD, item => {
          markBounds.union(boundItem(item, bound));
        });
        pulse.visit(pulse.MOD, item => {
          rebound = rebound || markBounds.alignsWith(item.bounds);
          view.dirty(item);
          markBounds.union(boundItem(item, bound));
        });
        if (rebound) {
          markBounds.clear();
          mark.items.forEach(item => markBounds.union(item.bounds));
        }
      }

      // ensure mark bounds do not exceed any clipping region
      vegaScenegraph.boundClip(mark);
      return pulse.modifies('bounds');
    }
  });
  function boundItem(item, bound, opt) {
    return bound(item.bounds.clear(), item, opt);
  }

  const COUNTER_NAME = ':vega_identifier:';

  /**
   * Adds a unique identifier to all added tuples.
   * This transform creates a new signal that serves as an id counter.
   * As a result, the id counter is shared across all instances of this
   * transform, generating unique ids across multiple data streams. In
   * addition, this signal value can be included in a snapshot of the
   * dataflow state, enabling correct resumption of id allocation.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {string} params.as - The field name for the generated identifier.
   */
  function Identifier(params) {
    vegaDataflow.Transform.call(this, 0, params);
  }
  Identifier.Definition = {
    'type': 'Identifier',
    'metadata': {
      'modifies': true
    },
    'params': [{
      'name': 'as',
      'type': 'string',
      'required': true
    }]
  };
  vegaUtil.inherits(Identifier, vegaDataflow.Transform, {
    transform(_, pulse) {
      const counter = getCounter(pulse.dataflow),
        as = _.as;
      let id = counter.value;
      pulse.visit(pulse.ADD, t => t[as] = t[as] || ++id);
      counter.set(this.value = id);
      return pulse;
    }
  });
  function getCounter(view) {
    return view._signals[COUNTER_NAME] || (view._signals[COUNTER_NAME] = view.add(0));
  }

  /**
   * Bind scenegraph items to a scenegraph mark instance.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {object} params.markdef - The mark definition for creating the mark.
   *   This is an object of legal scenegraph mark properties which *must* include
   *   the 'marktype' property.
   */
  function Mark(params) {
    vegaDataflow.Transform.call(this, null, params);
  }
  vegaUtil.inherits(Mark, vegaDataflow.Transform, {
    transform(_, pulse) {
      let mark = this.value;

      // acquire mark on first invocation, bind context and group
      if (!mark) {
        mark = pulse.dataflow.scenegraph().mark(_.markdef, lookup$1(_), _.index);
        mark.group.context = _.context;
        if (!_.context.group) _.context.group = mark.group;
        mark.source = this.source; // point to upstream collector
        mark.clip = _.clip;
        mark.interactive = _.interactive;
        this.value = mark;
      }

      // initialize entering items
      const Init = mark.marktype === Group ? vegaScenegraph.GroupItem : vegaScenegraph.Item;
      pulse.visit(pulse.ADD, item => Init.call(item, mark));

      // update clipping and/or interactive status
      if (_.modified('clip') || _.modified('interactive')) {
        mark.clip = _.clip;
        mark.interactive = !!_.interactive;
        mark.zdirty = true; // force scenegraph re-eval
        pulse.reflow();
      }

      // bind items array to scenegraph mark
      mark.items = pulse.source;
      return pulse;
    }
  });
  function lookup$1(_) {
    const g = _.groups,
      p = _.parent;
    return g && g.size === 1 ? g.get(Object.keys(g.object)[0]) : g && p ? g.lookup(p) : null;
  }

  /**
   * Analyze items for overlap, changing opacity to hide items with
   * overlapping bounding boxes. This transform will preserve at least
   * two items (e.g., first and last) even if overlap persists.
   * @param {object} params - The parameters for this operator.
   * @param {function(*,*): number} [params.sort] - A comparator
   *   function for sorting items.
   * @param {object} [params.method] - The overlap removal method to apply.
   *   One of 'parity' (default, hide every other item until there is no
   *   more overlap) or 'greedy' (sequentially scan and hide and items that
   *   overlap with the last visible item).
   * @param {object} [params.boundScale] - A scale whose range should be used
   *   to bound the items. Items exceeding the bounds of the scale range
   *   will be treated as overlapping. If null or undefined, no bounds check
   *   will be applied.
   * @param {object} [params.boundOrient] - The orientation of the scale
   *   (top, bottom, left, or right) used to bound items. This parameter is
   *   ignored if boundScale is null or undefined.
   * @param {object} [params.boundTolerance] - The tolerance in pixels for
   *   bound inclusion testing (default 1). This specifies by how many pixels
   *   an item's bounds may exceed the scale range bounds and not be culled.
   * @constructor
   */
  function Overlap(params) {
    vegaDataflow.Transform.call(this, null, params);
  }
  const methods = {
    parity: items => items.filter((item, i) => i % 2 ? item.opacity = 0 : 1),
    greedy: (items, sep) => {
      let a;
      return items.filter((b, i) => !i || !intersect(a.bounds, b.bounds, sep) ? (a = b, 1) : b.opacity = 0);
    }
  };

  // compute bounding box intersection
  // including padding pixels of separation
  const intersect = (a, b, sep) => sep > Math.max(b.x1 - a.x2, a.x1 - b.x2, b.y1 - a.y2, a.y1 - b.y2);
  const hasOverlap = (items, pad) => {
    for (var i = 1, n = items.length, a = items[0].bounds, b; i < n; a = b, ++i) {
      if (intersect(a, b = items[i].bounds, pad)) return true;
    }
  };
  const hasBounds = item => {
    const b = item.bounds;
    return b.width() > 1 && b.height() > 1;
  };
  const boundTest = (scale, orient, tolerance) => {
    var range = scale.range(),
      b = new vegaScenegraph.Bounds();
    if (orient === Top || orient === Bottom) {
      b.set(range[0], -Infinity, range[1], +Infinity);
    } else {
      b.set(-Infinity, range[0], +Infinity, range[1]);
    }
    b.expand(tolerance || 1);
    return item => b.encloses(item.bounds);
  };

  // reset all items to be fully opaque
  const reset = source => {
    source.forEach(item => item.opacity = 1);
    return source;
  };

  // add all tuples to mod, fork pulse if parameters were modified
  // fork prevents cross-stream tuple pollution (e.g., pulse from scale)
  const reflow = (pulse, _) => pulse.reflow(_.modified()).modifies('opacity');
  vegaUtil.inherits(Overlap, vegaDataflow.Transform, {
    transform(_, pulse) {
      const reduce = methods[_.method] || methods.parity,
        sep = _.separation || 0;
      let source = pulse.materialize(pulse.SOURCE).source,
        items,
        test;
      if (!source || !source.length) return;
      if (!_.method) {
        // early exit if method is falsy
        if (_.modified('method')) {
          reset(source);
          pulse = reflow(pulse, _);
        }
        return pulse;
      }

      // skip labels with no content
      source = source.filter(hasBounds);

      // early exit, nothing to do
      if (!source.length) return;
      if (_.sort) {
        source = source.slice().sort(_.sort);
      }
      items = reset(source);
      pulse = reflow(pulse, _);
      if (items.length >= 3 && hasOverlap(items, sep)) {
        do {
          items = reduce(items, sep);
        } while (items.length >= 3 && hasOverlap(items, sep));
        if (items.length < 3 && !vegaUtil.peek(source).opacity) {
          if (items.length > 1) vegaUtil.peek(items).opacity = 0;
          vegaUtil.peek(source).opacity = 1;
        }
      }
      if (_.boundScale && _.boundTolerance >= 0) {
        test = boundTest(_.boundScale, _.boundOrient, +_.boundTolerance);
        source.forEach(item => {
          if (!test(item)) item.opacity = 0;
        });
      }

      // re-calculate mark bounds
      const bounds = items[0].mark.bounds.clear();
      source.forEach(item => {
        if (item.opacity) bounds.union(item.bounds);
      });
      return pulse;
    }
  });

  /**
   * Queue modified scenegraph items for rendering.
   * @constructor
   */
  function Render(params) {
    vegaDataflow.Transform.call(this, null, params);
  }
  vegaUtil.inherits(Render, vegaDataflow.Transform, {
    transform(_, pulse) {
      const view = pulse.dataflow;
      pulse.visit(pulse.ALL, item => view.dirty(item));

      // set z-index dirty flag as needed
      if (pulse.fields && pulse.fields['zindex']) {
        const item = pulse.source && pulse.source[0];
        if (item) item.mark.zdirty = true;
      }
    }
  });

  const tempBounds = new vegaScenegraph.Bounds();
  function set(item, property, value) {
    return item[property] === value ? 0 : (item[property] = value, 1);
  }

  function isYAxis(mark) {
    var orient = mark.items[0].orient;
    return orient === Left || orient === Right;
  }
  function axisIndices(datum) {
    let index = +datum.grid;
    return [datum.ticks ? index++ : -1,
    // ticks index
    datum.labels ? index++ : -1,
    // labels index
    index + +datum.domain // title index
    ];
  }

  function axisLayout(view, axis, width, height) {
    var item = axis.items[0],
      datum = item.datum,
      delta = item.translate != null ? item.translate : 0.5,
      orient = item.orient,
      indices = axisIndices(datum),
      range = item.range,
      offset = item.offset,
      position = item.position,
      minExtent = item.minExtent,
      maxExtent = item.maxExtent,
      title = datum.title && item.items[indices[2]].items[0],
      titlePadding = item.titlePadding,
      bounds = item.bounds,
      dl = title && vegaScenegraph.multiLineOffset(title),
      x = 0,
      y = 0,
      i,
      s;
    tempBounds.clear().union(bounds);
    bounds.clear();
    if ((i = indices[0]) > -1) bounds.union(item.items[i].bounds);
    if ((i = indices[1]) > -1) bounds.union(item.items[i].bounds);

    // position axis group and title
    switch (orient) {
      case Top:
        x = position || 0;
        y = -offset;
        s = Math.max(minExtent, Math.min(maxExtent, -bounds.y1));
        bounds.add(0, -s).add(range, 0);
        if (title) axisTitleLayout(view, title, s, titlePadding, dl, 0, -1, bounds);
        break;
      case Left:
        x = -offset;
        y = position || 0;
        s = Math.max(minExtent, Math.min(maxExtent, -bounds.x1));
        bounds.add(-s, 0).add(0, range);
        if (title) axisTitleLayout(view, title, s, titlePadding, dl, 1, -1, bounds);
        break;
      case Right:
        x = width + offset;
        y = position || 0;
        s = Math.max(minExtent, Math.min(maxExtent, bounds.x2));
        bounds.add(0, 0).add(s, range);
        if (title) axisTitleLayout(view, title, s, titlePadding, dl, 1, 1, bounds);
        break;
      case Bottom:
        x = position || 0;
        y = height + offset;
        s = Math.max(minExtent, Math.min(maxExtent, bounds.y2));
        bounds.add(0, 0).add(range, s);
        if (title) axisTitleLayout(view, title, s, titlePadding, 0, 0, 1, bounds);
        break;
      default:
        x = item.x;
        y = item.y;
    }

    // update bounds
    vegaScenegraph.boundStroke(bounds.translate(x, y), item);
    if (set(item, 'x', x + delta) | set(item, 'y', y + delta)) {
      item.bounds = tempBounds;
      view.dirty(item);
      item.bounds = bounds;
      view.dirty(item);
    }
    return item.mark.bounds.clear().union(bounds);
  }
  function axisTitleLayout(view, title, offset, pad, dl, isYAxis, sign, bounds) {
    const b = title.bounds;
    if (title.auto) {
      const v = sign * (offset + dl + pad);
      let dx = 0,
        dy = 0;
      view.dirty(title);
      isYAxis ? dx = (title.x || 0) - (title.x = v) : dy = (title.y || 0) - (title.y = v);
      title.mark.bounds.clear().union(b.translate(-dx, -dy));
      view.dirty(title);
    }
    bounds.union(b);
  }

  // aggregation functions for grid margin determination
  const min = (a, b) => Math.floor(Math.min(a, b));
  const max = (a, b) => Math.ceil(Math.max(a, b));
  function gridLayoutGroups(group) {
    var groups = group.items,
      n = groups.length,
      i = 0,
      mark,
      items;
    const views = {
      marks: [],
      rowheaders: [],
      rowfooters: [],
      colheaders: [],
      colfooters: [],
      rowtitle: null,
      coltitle: null
    };

    // layout axes, gather legends, collect bounds
    for (; i < n; ++i) {
      mark = groups[i];
      items = mark.items;
      if (mark.marktype === Group) {
        switch (mark.role) {
          case AxisRole:
          case LegendRole:
          case TitleRole:
            break;
          case RowHeader:
            views.rowheaders.push(...items);
            break;
          case RowFooter:
            views.rowfooters.push(...items);
            break;
          case ColHeader:
            views.colheaders.push(...items);
            break;
          case ColFooter:
            views.colfooters.push(...items);
            break;
          case RowTitle:
            views.rowtitle = items[0];
            break;
          case ColTitle:
            views.coltitle = items[0];
            break;
          default:
            views.marks.push(...items);
        }
      }
    }
    return views;
  }
  function bboxFlush(item) {
    return new vegaScenegraph.Bounds().set(0, 0, item.width || 0, item.height || 0);
  }
  function bboxFull(item) {
    const b = item.bounds.clone();
    return b.empty() ? b.set(0, 0, 0, 0) : b.translate(-(item.x || 0), -(item.y || 0));
  }
  function get(opt, key, d) {
    const v = vegaUtil.isObject(opt) ? opt[key] : opt;
    return v != null ? v : d !== undefined ? d : 0;
  }
  function offsetValue(v) {
    return v < 0 ? Math.ceil(-v) : 0;
  }
  function gridLayout(view, groups, opt) {
    var dirty = !opt.nodirty,
      bbox = opt.bounds === Flush ? bboxFlush : bboxFull,
      bounds = tempBounds.set(0, 0, 0, 0),
      alignCol = get(opt.align, Column),
      alignRow = get(opt.align, Row),
      padCol = get(opt.padding, Column),
      padRow = get(opt.padding, Row),
      ncols = opt.columns || groups.length,
      nrows = ncols <= 0 ? 1 : Math.ceil(groups.length / ncols),
      n = groups.length,
      xOffset = Array(n),
      xExtent = Array(ncols),
      xMax = 0,
      yOffset = Array(n),
      yExtent = Array(nrows),
      yMax = 0,
      dx = Array(n),
      dy = Array(n),
      boxes = Array(n),
      m,
      i,
      c,
      r,
      b,
      g,
      px,
      py,
      x,
      y,
      offset;
    for (i = 0; i < ncols; ++i) xExtent[i] = 0;
    for (i = 0; i < nrows; ++i) yExtent[i] = 0;

    // determine offsets for each group
    for (i = 0; i < n; ++i) {
      g = groups[i];
      b = boxes[i] = bbox(g);
      g.x = g.x || 0;
      dx[i] = 0;
      g.y = g.y || 0;
      dy[i] = 0;
      c = i % ncols;
      r = ~~(i / ncols);
      xMax = Math.max(xMax, px = Math.ceil(b.x2));
      yMax = Math.max(yMax, py = Math.ceil(b.y2));
      xExtent[c] = Math.max(xExtent[c], px);
      yExtent[r] = Math.max(yExtent[r], py);
      xOffset[i] = padCol + offsetValue(b.x1);
      yOffset[i] = padRow + offsetValue(b.y1);
      if (dirty) view.dirty(groups[i]);
    }

    // set initial alignment offsets
    for (i = 0; i < n; ++i) {
      if (i % ncols === 0) xOffset[i] = 0;
      if (i < ncols) yOffset[i] = 0;
    }

    // enforce column alignment constraints
    if (alignCol === Each) {
      for (c = 1; c < ncols; ++c) {
        for (offset = 0, i = c; i < n; i += ncols) {
          if (offset < xOffset[i]) offset = xOffset[i];
        }
        for (i = c; i < n; i += ncols) {
          xOffset[i] = offset + xExtent[c - 1];
        }
      }
    } else if (alignCol === All) {
      for (offset = 0, i = 0; i < n; ++i) {
        if (i % ncols && offset < xOffset[i]) offset = xOffset[i];
      }
      for (i = 0; i < n; ++i) {
        if (i % ncols) xOffset[i] = offset + xMax;
      }
    } else {
      for (alignCol = false, c = 1; c < ncols; ++c) {
        for (i = c; i < n; i += ncols) {
          xOffset[i] += xExtent[c - 1];
        }
      }
    }

    // enforce row alignment constraints
    if (alignRow === Each) {
      for (r = 1; r < nrows; ++r) {
        for (offset = 0, i = r * ncols, m = i + ncols; i < m; ++i) {
          if (offset < yOffset[i]) offset = yOffset[i];
        }
        for (i = r * ncols; i < m; ++i) {
          yOffset[i] = offset + yExtent[r - 1];
        }
      }
    } else if (alignRow === All) {
      for (offset = 0, i = ncols; i < n; ++i) {
        if (offset < yOffset[i]) offset = yOffset[i];
      }
      for (i = ncols; i < n; ++i) {
        yOffset[i] = offset + yMax;
      }
    } else {
      for (alignRow = false, r = 1; r < nrows; ++r) {
        for (i = r * ncols, m = i + ncols; i < m; ++i) {
          yOffset[i] += yExtent[r - 1];
        }
      }
    }

    // perform horizontal grid layout
    for (x = 0, i = 0; i < n; ++i) {
      x = xOffset[i] + (i % ncols ? x : 0);
      dx[i] += x - groups[i].x;
    }

    // perform vertical grid layout
    for (c = 0; c < ncols; ++c) {
      for (y = 0, i = c; i < n; i += ncols) {
        y += yOffset[i];
        dy[i] += y - groups[i].y;
      }
    }

    // perform horizontal centering
    if (alignCol && get(opt.center, Column) && nrows > 1) {
      for (i = 0; i < n; ++i) {
        b = alignCol === All ? xMax : xExtent[i % ncols];
        x = b - boxes[i].x2 - groups[i].x - dx[i];
        if (x > 0) dx[i] += x / 2;
      }
    }

    // perform vertical centering
    if (alignRow && get(opt.center, Row) && ncols !== 1) {
      for (i = 0; i < n; ++i) {
        b = alignRow === All ? yMax : yExtent[~~(i / ncols)];
        y = b - boxes[i].y2 - groups[i].y - dy[i];
        if (y > 0) dy[i] += y / 2;
      }
    }

    // position grid relative to anchor
    for (i = 0; i < n; ++i) {
      bounds.union(boxes[i].translate(dx[i], dy[i]));
    }
    x = get(opt.anchor, X);
    y = get(opt.anchor, Y);
    switch (get(opt.anchor, Column)) {
      case End:
        x -= bounds.width();
        break;
      case Middle:
        x -= bounds.width() / 2;
    }
    switch (get(opt.anchor, Row)) {
      case End:
        y -= bounds.height();
        break;
      case Middle:
        y -= bounds.height() / 2;
    }
    x = Math.round(x);
    y = Math.round(y);

    // update mark positions, bounds, dirty
    bounds.clear();
    for (i = 0; i < n; ++i) {
      groups[i].mark.bounds.clear();
    }
    for (i = 0; i < n; ++i) {
      g = groups[i];
      g.x += dx[i] += x;
      g.y += dy[i] += y;
      bounds.union(g.mark.bounds.union(g.bounds.translate(dx[i], dy[i])));
      if (dirty) view.dirty(g);
    }
    return bounds;
  }
  function trellisLayout(view, group, opt) {
    var views = gridLayoutGroups(group),
      groups = views.marks,
      bbox = opt.bounds === Flush ? boundFlush : boundFull,
      off = opt.offset,
      ncols = opt.columns || groups.length,
      nrows = ncols <= 0 ? 1 : Math.ceil(groups.length / ncols),
      cells = nrows * ncols,
      x,
      y,
      x2,
      y2,
      anchor,
      band,
      offset;

    // -- initial grid layout
    const bounds = gridLayout(view, groups, opt);
    if (bounds.empty()) bounds.set(0, 0, 0, 0); // empty grid

    // -- layout grid headers and footers --

    // perform row header layout
    if (views.rowheaders) {
      band = get(opt.headerBand, Row, null);
      x = layoutHeaders(view, views.rowheaders, groups, ncols, nrows, -get(off, 'rowHeader'), min, 0, bbox, 'x1', 0, ncols, 1, band);
    }

    // perform column header layout
    if (views.colheaders) {
      band = get(opt.headerBand, Column, null);
      y = layoutHeaders(view, views.colheaders, groups, ncols, ncols, -get(off, 'columnHeader'), min, 1, bbox, 'y1', 0, 1, ncols, band);
    }

    // perform row footer layout
    if (views.rowfooters) {
      band = get(opt.footerBand, Row, null);
      x2 = layoutHeaders(view, views.rowfooters, groups, ncols, nrows, get(off, 'rowFooter'), max, 0, bbox, 'x2', ncols - 1, ncols, 1, band);
    }

    // perform column footer layout
    if (views.colfooters) {
      band = get(opt.footerBand, Column, null);
      y2 = layoutHeaders(view, views.colfooters, groups, ncols, ncols, get(off, 'columnFooter'), max, 1, bbox, 'y2', cells - ncols, 1, ncols, band);
    }

    // perform row title layout
    if (views.rowtitle) {
      anchor = get(opt.titleAnchor, Row);
      offset = get(off, 'rowTitle');
      offset = anchor === End ? x2 + offset : x - offset;
      band = get(opt.titleBand, Row, 0.5);
      layoutTitle(view, views.rowtitle, offset, 0, bounds, band);
    }

    // perform column title layout
    if (views.coltitle) {
      anchor = get(opt.titleAnchor, Column);
      offset = get(off, 'columnTitle');
      offset = anchor === End ? y2 + offset : y - offset;
      band = get(opt.titleBand, Column, 0.5);
      layoutTitle(view, views.coltitle, offset, 1, bounds, band);
    }
  }
  function boundFlush(item, field) {
    return field === 'x1' ? item.x || 0 : field === 'y1' ? item.y || 0 : field === 'x2' ? (item.x || 0) + (item.width || 0) : field === 'y2' ? (item.y || 0) + (item.height || 0) : undefined;
  }
  function boundFull(item, field) {
    return item.bounds[field];
  }
  function layoutHeaders(view, headers, groups, ncols, limit, offset, agg, isX, bound, bf, start, stride, back, band) {
    var n = groups.length,
      init = 0,
      edge = 0,
      i,
      j,
      k,
      m,
      b,
      h,
      g,
      x,
      y;

    // if no groups, early exit and return 0
    if (!n) return init;

    // compute margin
    for (i = start; i < n; i += stride) {
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
    for (j = 0, m = headers.length; j < m; ++j) {
      view.dirty(headers[j]);
      headers[j].mark.bounds.clear();
    }

    // layout each header
    for (i = start, j = 0, m = headers.length; j < m; ++j, i += stride) {
      h = headers[j];
      b = h.mark.bounds;

      // search for nearest group to align to
      // necessary if table has empty cells
      for (k = i; k >= 0 && (g = groups[k]) == null; k -= back);

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
    var x = offset,
      y = offset;
    isX ? x = Math.round(bounds.x1 + band * bounds.width()) : y = Math.round(bounds.y1 + band * bounds.height());

    // assign coordinates and update bounds
    g.bounds.translate(x - (g.x || 0), y - (g.y || 0));
    g.mark.bounds.clear().union(g.bounds);
    g.x = x;
    g.y = y;

    // queue title for redraw
    view.dirty(g);
  }

  // utility for looking up legend layout configuration
  function lookup(config, orient) {
    const opt = config[orient] || {};
    return (key, d) => opt[key] != null ? opt[key] : config[key] != null ? config[key] : d;
  }

  // if legends specify offset directly, use the maximum specified value
  function offsets(legends, value) {
    let max = -Infinity;
    legends.forEach(item => {
      if (item.offset != null) max = Math.max(max, item.offset);
    });
    return max > -Infinity ? max : value;
  }
  function legendParams(g, orient, config, xb, yb, w, h) {
    const _ = lookup(config, orient),
      offset = offsets(g, _('offset', 0)),
      anchor = _('anchor', Start),
      mult = anchor === End ? 1 : anchor === Middle ? 0.5 : 0;
    const p = {
      align: Each,
      bounds: _('bounds', Flush),
      columns: _('direction') === 'vertical' ? 1 : g.length,
      padding: _('margin', 8),
      center: _('center'),
      nodirty: true
    };
    switch (orient) {
      case Left:
        p.anchor = {
          x: Math.floor(xb.x1) - offset,
          column: End,
          y: mult * (h || xb.height() + 2 * xb.y1),
          row: anchor
        };
        break;
      case Right:
        p.anchor = {
          x: Math.ceil(xb.x2) + offset,
          y: mult * (h || xb.height() + 2 * xb.y1),
          row: anchor
        };
        break;
      case Top:
        p.anchor = {
          y: Math.floor(yb.y1) - offset,
          row: End,
          x: mult * (w || yb.width() + 2 * yb.x1),
          column: anchor
        };
        break;
      case Bottom:
        p.anchor = {
          y: Math.ceil(yb.y2) + offset,
          x: mult * (w || yb.width() + 2 * yb.x1),
          column: anchor
        };
        break;
      case TopLeft:
        p.anchor = {
          x: offset,
          y: offset
        };
        break;
      case TopRight:
        p.anchor = {
          x: w - offset,
          y: offset,
          column: End
        };
        break;
      case BottomLeft:
        p.anchor = {
          x: offset,
          y: h - offset,
          row: End
        };
        break;
      case BottomRight:
        p.anchor = {
          x: w - offset,
          y: h - offset,
          column: End,
          row: End
        };
        break;
    }
    return p;
  }
  function legendLayout(view, legend) {
    var item = legend.items[0],
      datum = item.datum,
      orient = item.orient,
      bounds = item.bounds,
      x = item.x,
      y = item.y,
      w,
      h;

    // cache current bounds for later comparison
    item._bounds ? item._bounds.clear().union(bounds) : item._bounds = bounds.clone();
    bounds.clear();

    // adjust legend to accommodate padding and title
    legendGroupLayout(view, item, item.items[0].items[0]);

    // aggregate bounds to determine size, and include origin
    bounds = legendBounds(item, bounds);
    w = 2 * item.padding;
    h = 2 * item.padding;
    if (!bounds.empty()) {
      w = Math.ceil(bounds.width() + w);
      h = Math.ceil(bounds.height() + h);
    }
    if (datum.type === Symbols) {
      legendEntryLayout(item.items[0].items[0].items[0].items);
    }
    if (orient !== None) {
      item.x = x = 0;
      item.y = y = 0;
    }
    item.width = w;
    item.height = h;
    vegaScenegraph.boundStroke(bounds.set(x, y, x + w, y + h), item);
    item.mark.bounds.clear().union(bounds);
    return item;
  }
  function legendBounds(item, b) {
    // aggregate item bounds
    item.items.forEach(_ => b.union(_.bounds));

    // anchor to legend origin
    b.x1 = item.padding;
    b.y1 = item.padding;
    return b;
  }
  function legendGroupLayout(view, item, entry) {
    var pad = item.padding,
      ex = pad - entry.x,
      ey = pad - entry.y;
    if (!item.datum.title) {
      if (ex || ey) translate(view, entry, ex, ey);
    } else {
      var title = item.items[1].items[0],
        anchor = title.anchor,
        tpad = item.titlePadding || 0,
        tx = pad - title.x,
        ty = pad - title.y;
      switch (title.orient) {
        case Left:
          ex += Math.ceil(title.bounds.width()) + tpad;
          break;
        case Right:
        case Bottom:
          break;
        default:
          ey += title.bounds.height() + tpad;
      }
      if (ex || ey) translate(view, entry, ex, ey);
      switch (title.orient) {
        case Left:
          ty += legendTitleOffset(item, entry, title, anchor, 1, 1);
          break;
        case Right:
          tx += legendTitleOffset(item, entry, title, End, 0, 0) + tpad;
          ty += legendTitleOffset(item, entry, title, anchor, 1, 1);
          break;
        case Bottom:
          tx += legendTitleOffset(item, entry, title, anchor, 0, 0);
          ty += legendTitleOffset(item, entry, title, End, -1, 0, 1) + tpad;
          break;
        default:
          tx += legendTitleOffset(item, entry, title, anchor, 0, 0);
      }
      if (tx || ty) translate(view, title, tx, ty);

      // translate legend if title pushes into negative coordinates
      if ((tx = Math.round(title.bounds.x1 - pad)) < 0) {
        translate(view, entry, -tx, 0);
        translate(view, title, -tx, 0);
      }
    }
  }
  function legendTitleOffset(item, entry, title, anchor, y, lr, noBar) {
    const grad = item.datum.type !== 'symbol',
      vgrad = title.datum.vgrad,
      e = grad && (lr || !vgrad) && !noBar ? entry.items[0] : entry,
      s = e.bounds[y ? 'y2' : 'x2'] - item.padding,
      u = vgrad && lr ? s : 0,
      v = vgrad && lr ? 0 : s,
      o = y <= 0 ? 0 : vegaScenegraph.multiLineOffset(title);
    return Math.round(anchor === Start ? u : anchor === End ? v - o : 0.5 * (s - o));
  }
  function translate(view, item, dx, dy) {
    item.x += dx;
    item.y += dy;
    item.bounds.translate(dx, dy);
    item.mark.bounds.translate(dx, dy);
    view.dirty(item);
  }
  function legendEntryLayout(entries) {
    // get max widths for each column
    const widths = entries.reduce((w, g) => {
      w[g.column] = Math.max(g.bounds.x2 - g.x, w[g.column] || 0);
      return w;
    }, {});

    // set dimensions of legend entry groups
    entries.forEach(g => {
      g.width = widths[g.column];
      g.height = g.bounds.y2 - g.y;
    });
  }

  function titleLayout(view, mark, width, height, viewBounds) {
    var group = mark.items[0],
      frame = group.frame,
      orient = group.orient,
      anchor = group.anchor,
      offset = group.offset,
      padding = group.padding,
      title = group.items[0].items[0],
      subtitle = group.items[1] && group.items[1].items[0],
      end = orient === Left || orient === Right ? height : width,
      start = 0,
      x = 0,
      y = 0,
      sx = 0,
      sy = 0,
      pos;
    if (frame !== Group) {
      orient === Left ? (start = viewBounds.y2, end = viewBounds.y1) : orient === Right ? (start = viewBounds.y1, end = viewBounds.y2) : (start = viewBounds.x1, end = viewBounds.x2);
    } else if (orient === Left) {
      start = height, end = 0;
    }
    pos = anchor === Start ? start : anchor === End ? end : (start + end) / 2;
    if (subtitle && subtitle.text) {
      // position subtitle
      switch (orient) {
        case Top:
        case Bottom:
          sy = title.bounds.height() + padding;
          break;
        case Left:
          sx = title.bounds.width() + padding;
          break;
        case Right:
          sx = -title.bounds.width() - padding;
          break;
      }
      tempBounds.clear().union(subtitle.bounds);
      tempBounds.translate(sx - (subtitle.x || 0), sy - (subtitle.y || 0));
      if (set(subtitle, 'x', sx) | set(subtitle, 'y', sy)) {
        view.dirty(subtitle);
        subtitle.bounds.clear().union(tempBounds);
        subtitle.mark.bounds.clear().union(tempBounds);
        view.dirty(subtitle);
      }
      tempBounds.clear().union(subtitle.bounds);
    } else {
      tempBounds.clear();
    }
    tempBounds.union(title.bounds);

    // position title group
    switch (orient) {
      case Top:
        x = pos;
        y = viewBounds.y1 - tempBounds.height() - offset;
        break;
      case Left:
        x = viewBounds.x1 - tempBounds.width() - offset;
        y = pos;
        break;
      case Right:
        x = viewBounds.x2 + tempBounds.width() + offset;
        y = pos;
        break;
      case Bottom:
        x = pos;
        y = viewBounds.y2 + offset;
        break;
      default:
        x = group.x;
        y = group.y;
    }
    if (set(group, 'x', x) | set(group, 'y', y)) {
      tempBounds.translate(x, y);
      view.dirty(group);
      group.bounds.clear().union(tempBounds);
      mark.bounds.clear().union(tempBounds);
      view.dirty(group);
    }
    return group.bounds;
  }

  /**
   * Layout view elements such as axes and legends.
   * Also performs size adjustments.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {object} params.mark - Scenegraph mark of groups to layout.
   */
  function ViewLayout(params) {
    vegaDataflow.Transform.call(this, null, params);
  }
  vegaUtil.inherits(ViewLayout, vegaDataflow.Transform, {
    transform(_, pulse) {
      const view = pulse.dataflow;
      _.mark.items.forEach(group => {
        if (_.layout) trellisLayout(view, group, _.layout);
        layoutGroup(view, group, _);
      });
      return shouldReflow(_.mark.group) ? pulse.reflow() : pulse;
    }
  });
  function shouldReflow(group) {
    // We typically should reflow if layout is invoked (#2568), as child items
    // may have resized and reflow ensures group bounds are re-calculated.
    // However, legend entries have a special exception to avoid instability.
    // For example, if a selected legend symbol gains a stroke on hover,
    // we don't want to re-position subsequent elements in the legend.
    return group && group.mark.role !== 'legend-entry';
  }
  function layoutGroup(view, group, _) {
    var items = group.items,
      width = Math.max(0, group.width || 0),
      height = Math.max(0, group.height || 0),
      viewBounds = new vegaScenegraph.Bounds().set(0, 0, width, height),
      xBounds = viewBounds.clone(),
      yBounds = viewBounds.clone(),
      legends = [],
      title,
      mark,
      orient,
      b,
      i,
      n;

    // layout axes, gather legends, collect bounds
    for (i = 0, n = items.length; i < n; ++i) {
      mark = items[i];
      switch (mark.role) {
        case AxisRole:
          b = isYAxis(mark) ? xBounds : yBounds;
          b.union(axisLayout(view, mark, width, height));
          break;
        case TitleRole:
          title = mark;
          break;
        case LegendRole:
          legends.push(legendLayout(view, mark));
          break;
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
      // group legends by orient
      const l = {};
      legends.forEach(item => {
        orient = item.orient || Right;
        if (orient !== None) (l[orient] || (l[orient] = [])).push(item);
      });

      // perform grid layout for each orient group
      for (const orient in l) {
        const g = l[orient];
        gridLayout(view, g, legendParams(g, orient, _.legends, xBounds, yBounds, width, height));
      }

      // update view bounds
      legends.forEach(item => {
        const b = item.bounds;
        if (!b.equals(item._bounds)) {
          item.bounds = item._bounds;
          view.dirty(item); // dirty previous location
          item.bounds = b;
          view.dirty(item);
        }
        if (_.autosize && (_.autosize.type === Fit || _.autosize.type === FitX || _.autosize.type === FitY)) {
          // For autosize fit, incorporate the orthogonal dimension only.
          // Legends that overrun the chart area will then be clipped;
          // otherwise the chart area gets reduced to nothing!
          switch (item.orient) {
            case Left:
            case Right:
              viewBounds.add(b.x1, 0).add(b.x2, 0);
              break;
            case Top:
            case Bottom:
              viewBounds.add(0, b.y1).add(0, b.y2);
          }
        } else {
          viewBounds.union(b);
        }
      });
    }

    // combine bounding boxes
    viewBounds.union(xBounds).union(yBounds);

    // layout title, adjust bounds
    if (title) {
      viewBounds.union(titleLayout(view, title, width, height, viewBounds));
    }

    // override aggregated view bounds if content is clipped
    if (group.clip) {
      viewBounds.set(0, 0, group.width || 0, group.height || 0);
    }

    // perform size adjustment
    viewSizeLayout(view, group, viewBounds, _);
  }
  function viewSizeLayout(view, group, viewBounds, _) {
    const auto = _.autosize || {},
      type = auto.type;
    if (view._autosize < 1 || !type) return;
    let viewWidth = view._width,
      viewHeight = view._height,
      width = Math.max(0, group.width || 0),
      left = Math.max(0, Math.ceil(-viewBounds.x1)),
      height = Math.max(0, group.height || 0),
      top = Math.max(0, Math.ceil(-viewBounds.y1));
    const right = Math.max(0, Math.ceil(viewBounds.x2 - width)),
      bottom = Math.max(0, Math.ceil(viewBounds.y2 - height));
    if (auto.contains === Padding) {
      const padding = view.padding();
      viewWidth -= padding.left + padding.right;
      viewHeight -= padding.top + padding.bottom;
    }
    if (type === None) {
      left = 0;
      top = 0;
      width = viewWidth;
      height = viewHeight;
    } else if (type === Fit) {
      width = Math.max(0, viewWidth - left - right);
      height = Math.max(0, viewHeight - top - bottom);
    } else if (type === FitX) {
      width = Math.max(0, viewWidth - left - right);
      viewHeight = height + top + bottom;
    } else if (type === FitY) {
      viewWidth = width + left + right;
      height = Math.max(0, viewHeight - top - bottom);
    } else if (type === Pad) {
      viewWidth = width + left + right;
      viewHeight = height + top + bottom;
    }
    view._resizeView(viewWidth, viewHeight, width, height, [left, top], auto.resize);
  }

  exports.bound = Bound;
  exports.identifier = Identifier;
  exports.mark = Mark;
  exports.overlap = Overlap;
  exports.render = Render;
  exports.viewlayout = ViewLayout;

}));
