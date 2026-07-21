import {AxisRole, Group, LegendRole, TitleRole} from './constants.js';
import {Transform, visitChunked} from 'vega-dataflow';
import {Marks, boundClip} from 'vega-scenegraph';
import {inherits} from 'vega-util';

const SCHEDULING_BATCH = 256;

/**
 * Calculate bounding boxes for scenegraph items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.mark - The scenegraph mark instance to bound.
 */
export default function Bound(params) {
  Transform.call(this, null, params);
}

inherits(Bound, Transform, {
  transform(_, pulse) {
    const view = pulse.dataflow,
          mark = _.mark,
          type = mark.marktype,
          entry = Marks[type],
          bound = entry.bound,
          modified = _.modified(),
          scheduler = view._scheduler,
          chunked = !!scheduler && !pulse.pulses
            && mark.items.length > SCHEDULING_BATCH;

    let markBounds = mark.bounds;

    if (entry.nested) {
      // multi-item marks have a single bounds instance
      if (mark.items.length) view.dirty(mark.items[0]);
      markBounds = boundItem(mark, bound);
      mark.items.forEach(item => {
        item.bounds.clear().union(markBounds);
      });
    }

    else if (type === Group || modified) {
      // operator parameters modified -> re-bound all items
      // updates group bounds in response to modified group content
      const visit = {
        dirty: item => view.dirty(item),
        bound: item => { markBounds.union(boundItem(item, bound)); }
      };

      if (chunked) return boundAllChunked(pulse, mark, scheduler, visit);

      pulse.visit(pulse.MOD, visit.dirty);
      markBounds.clear();
      mark.items.forEach(visit.bound);

      reflowLayout(pulse, mark);
    }

    else {
      // incrementally update bounds, re-bound mark as needed
      const visit = {
        rebound: pulse.changed(pulse.REM),

        add: item => { markBounds.union(boundItem(item, bound)); },

        mod: item => {
          visit.rebound = visit.rebound || markBounds.alignsWith(item.bounds);
          view.dirty(item);
          markBounds.union(boundItem(item, bound));
        },

        union: item => { markBounds.union(item.bounds); }
      };

      if (chunked) return boundIncrementalChunked(pulse, mark, scheduler, visit);

      pulse.visit(pulse.ADD, visit.add);
      pulse.visit(pulse.MOD, visit.mod);

      if (visit.rebound) {
        markBounds.clear();
        mark.items.forEach(visit.union);
      }
    }

    return boundResult(mark, pulse);
  }
});

function boundItem(item, bound, opt) {
  return bound(item.bounds.clear(), item, opt);
}

function collect(pulse, flags) {
  const items = [];
  pulse.visit(flags, item => { items.push(item); });
  return items;
}

async function boundAllChunked(pulse, mark, scheduler, visit) {
  await visitChunked(
    collect(pulse, pulse.MOD), visit.dirty, scheduler, SCHEDULING_BATCH
  );
  mark.bounds.clear();
  await visitChunked(mark.items, visit.bound, scheduler, SCHEDULING_BATCH);

  reflowLayout(pulse, mark);

  return boundResult(mark, pulse);
}

async function boundIncrementalChunked(pulse, mark, scheduler, visit) {
  await visitChunked(
    collect(pulse, pulse.ADD), visit.add, scheduler, SCHEDULING_BATCH
  );
  await visitChunked(
    collect(pulse, pulse.MOD), visit.mod, scheduler, SCHEDULING_BATCH
  );

  if (visit.rebound) {
    mark.bounds.clear();
    await visitChunked(mark.items, visit.union, scheduler, SCHEDULING_BATCH);
  }

  return boundResult(mark, pulse);
}

function reflowLayout(pulse, mark) {
  // force reflow for axes/legends/titles to propagate any layout changes
  switch (mark.role) {
    case AxisRole:
    case LegendRole:
    case TitleRole:
      pulse.reflow();
  }
}

function boundResult(mark, pulse) {
  // ensure mark bounds do not exceed any clipping region
  boundClip(mark);

  return pulse.modifies('bounds');
}
