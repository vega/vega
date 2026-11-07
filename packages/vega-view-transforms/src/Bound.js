import {AxisRole, Group, LegendRole, TitleRole} from './constants.js';
import {Transform} from 'vega-dataflow';
import {Marks, boundClip, textProcessorPending, textProcessorWarnings} from 'vega-scenegraph';
import {inherits} from 'vega-util';

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
          bound = entry.bound;

    let markBounds = mark.bounds, rebound;

    if (entry.nested) {
      // multi-item marks have a single bounds instance
      if (mark.items.length) view.dirty(mark.items[0]);
      markBounds = boundItem(mark, bound);
      mark.items.forEach(item => {
        item.bounds.clear().union(markBounds);
      });
    }

    else if (type === Group || _.modified()) {
      // operator parameters modified -> re-bound all items
      // updates group bounds in response to modified group content
      pulse.visit(pulse.MOD, item => view.dirty(item));
      markBounds.clear();
      mark.items.forEach(item => markBounds.union(boundItem(item, bound)));

      // force reflow for axes/legends/titles to propagate any layout changes
      reflow(mark, pulse);
    }

    else {
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
    boundClip(mark);

    const out = pulse.modifies('bounds');

    // text processors may need to load resources (such as font data):
    // wait for them, then re-bound, so that evaluation and exported images
    // include the processed text rather than the standard text fallback
    if (type === 'text') {
      textProcessorWarnings().forEach(msg => view.warn(msg));
      const pending = textProcessorPending();
      if (pending.length) return reprocess(view, mark, bound, pulse, pending);
    }

    return out;
  }
});

async function reprocess(view, mark, bound, pulse, pending) {
  // processors bound the number of retries for a text, so this terminates
  while (pending.length) {
    await Promise.allSettled(pending);
    mark.bounds.clear();
    mark.items.forEach(item => {
      view.dirty(item);
      mark.bounds.union(boundItem(item, bound));
    });
    boundClip(mark);
    textProcessorWarnings().forEach(msg => view.warn(msg));
    pending = textProcessorPending();
  }
  reflow(mark, pulse);
  return pulse;
}

function reflow(mark, pulse) {
  switch (mark.role) {
    case AxisRole:
    case LegendRole:
    case TitleRole:
      pulse.reflow();
  }
}

function boundItem(item, bound, opt) {
  return bound(item.bounds.clear(), item, opt);
}
